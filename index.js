/*
 * Copyright (c) 2020 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, FluxDispatcher, i18n: { Messages } } = require('powercord/webpack');
const { open } = require('powercord/modal');
const i18n = require('./i18n');

const GuildProfileModal = require('./components/GuildProfileModal');

module.exports = class GuildProfile extends Plugin {
  async startPlugin() {
    this.log('Icons provided by https://iconify.design/');
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('styles.scss');
    this._injectContextMenu();
    this._injectMenu();
  }

  requestMemberData(guildId) {
    return new Promise((resolve) => {
      const { requestMembers } = getModule(['requestMembers'], false);
      requestMembers(guildId);

      function onReceived(e) {
        if (e.guildId === guildId) {
          let membersOnline = e.groups.map(group => group.id != "offline" ? group.count : 0).reduce((a, b) => {
            return a + b;
          }, 0);
          resolve({ members: e.memberCount, membersOnline });
          FluxDispatcher.unsubscribe('GUILD_MEMBER_LIST_UPDATE', onReceived);
        }
      }

      FluxDispatcher.subscribe('GUILD_MEMBER_LIST_UPDATE', onReceived);
    });
  }

  async _injectContextMenu() {
    const { MenuGroup, MenuItem } = await getModule(['MenuItem']);
    const GuildContextMenu = await getModule(m => m.default && m.default.displayName === 'GuildContextMenu');

    const requestMemberData = (guildId) => {
      return this.requestMemberData(guildId);
    }

    inject('guild-profile-context-menu', GuildContextMenu, 'default', ([{ guild }], res) => {
      res.props.children.splice(0, 0,
        React.createElement(MenuGroup, {},
          React.createElement(MenuItem, {
            key: 'guild-profile',
            label: Messages.GUILD_PROFILE,
            action: () => open(() => React.createElement(GuildProfileModal, { guild, section: 'GUILD_INFO', requestMemberData }))
          })
        )
      );
      return res;
    });
    GuildContextMenu.default.displayName = 'GuildContextMenu';
  }

  async _injectMenu() {
    const key = 'guild-profile';
    const Menu = await getModule(['MenuItem']);
    const { getGuild } = await getModule(['getGuild']);
    const { getGuildId } = await getModule(['getLastSelectedGuildId']);

    const requestMemberData = (guildId) => {
      return this.requestMemberData(guildId);
    }

    inject('guild-profile-menu', Menu, 'default', ([{ children }], res) => {
      if (res.props.id !== 'guild-header-popout') return res;

      if (!children.some(group => {
        if (!group) return false;
        const groupChildren = group.props.children;

        if (typeof groupChildren === 'array') {
          return groupChildren.some(item => item.key === key)
        } else {
          return groupChildren.key === key;
        }
      })) {
        children.unshift(
          React.createElement(Menu.MenuGroup, {},
            React.createElement(Menu.MenuItem, {
              key,
              label: Messages.GUILD_PROFILE,
              action: () => open(() => React.createElement(GuildProfileModal, { guild: getGuild(getGuildId()), section: 'GUILD_INFO', requestMemberData }))
            })
          )
        );
      }
      return res;
    });
    Menu.default.displayName = 'Menu';
  }

  pluginWillUnload() {
    uninject('guild-profile-context-menu');
    uninject('guild-profile-menu');
  }
}
