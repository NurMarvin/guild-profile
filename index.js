/*
 * Copyright (c) 2020 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, FluxDispatcher, i18n: { Messages } } = require('powercord/webpack');
const { open } = require('powercord/modal');
const { findInReactTree } = require('powercord/util')
const i18n = require('./i18n');

const GuildProfileModal = require('./components/GuildProfileModal');

const memberCountsStore = require('./memberCountsStore/store');
const memberCountsActions = require('./memberCountsStore/actions');

module.exports = class GuildProfile extends Plugin {
  async startPlugin() {
    this.log('Icons provided by https://iconify.design/');
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('styles.scss');
    this._injectContextMenu();
    this._injectMenu();

    _.bindAll(this, ['handleMemberListUpdate']);

    FluxDispatcher.subscribe('GUILD_MEMBER_LIST_UPDATE', this.handleMemberListUpdate);
  }

  handleMemberListUpdate(memberListUpdate) {
    this.updateMemberCounts(memberListUpdate);
  }

  getMemberCounts(id) {
    return new Promise((resolve) => {
      const memberCounts = memberCountsStore.getMemberCounts(id);

      // If the member count is in the Flux store just send that data 
      if (memberCounts) {
        resolve(memberCounts);
        return;
      }

      const { requestMembers } = getModule(['requestMembers'], false);
      requestMembers(id);

      const updateMemberCounts = (memberListUpdate) => {
        return this.updateMemberCounts(memberListUpdate);
      }

      function onReceived(memberListUpdate) {
        if (memberListUpdate.guildId === id) {
          resolve(updateMemberCounts(memberListUpdate));
        }
      }

      FluxDispatcher.subscribe('GUILD_MEMBER_LIST_UPDATE', onReceived);
    });
  }

  updateMemberCounts(memberListUpdate) {
    const { guildId, memberCount, groups } = memberListUpdate;
    const onlineCount = groups.map(group => group.id != "offline" ? group.count : 0).reduce((a, b) => {
      return a + b;
    }, 0);
    const memberCounts = { guildId, memberCount, onlineCount };

    memberCountsActions.updateMemberCounts(memberCounts);
    return memberCounts;
  }

  async _injectContextMenu() {
    const { MenuGroup, MenuItem } = await getModule(['MenuItem']);
    const GuildContextMenu = await getModule(m => m.default && m.default.displayName === 'GuildContextMenu');

    const getMemberCounts = (guildId) => {
      return this.getMemberCounts(guildId);
    }

    inject('guild-profile-context-menu', GuildContextMenu, 'default', ([{ guild }], res) => {
      res.props.children.splice(0, 0,
        React.createElement(MenuGroup, {},
          React.createElement(MenuItem, {
            key: 'guild-profile',
            label: Messages.GUILD_PROFILE,
            action: () => open(() => React.createElement(GuildProfileModal, { guild, section: 'GUILD_INFO', getMemberCounts }))
          })
        )
      );
      return res;
    });
    GuildContextMenu.default.displayName = 'GuildContextMenu';
  }

  async _injectMenu() {
    const id = 'guild-profile';
    const Menu = await getModule(['MenuItem']);
    const { getGuild } = await getModule(['getGuild']);
    const { getGuildId } = await getModule(['getLastSelectedGuildId']);

    const getMemberCounts = (guildId) => {
      return this.getMemberCounts(guildId);
    }

    inject('guild-profile-menu', Menu, 'default', ([{ children }], res) => {
      if (res.props.id !== 'guild-header-popout') return res;

      if (!findInReactTree(res, c => c.props && c.props.id == id)) {
        children.unshift(
          React.createElement(Menu.MenuGroup, null, React.createElement(Menu.MenuItem, {
            id,
            label: Messages.GUILD_PROFILE,
            action: () => open(() => React.createElement(GuildProfileModal, { guild: getGuild(getGuildId()), section: 'GUILD_INFO', getMemberCounts }))
          }))
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
