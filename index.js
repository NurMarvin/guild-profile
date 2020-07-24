const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { React, getModule, FluxDispatcher, i18n: { Messages } } = require('powercord/webpack');
const { open } = require('powercord/modal');
const i18n = require('./i18n');

const GuildProfileModal = require('./components/GuildProfileModal');

module.exports = class GuildProfile extends Plugin {
  async startPlugin() {
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('styles.scss');
    this._injectContextMenu();
  }

  requestMemberData(guildId) {
    return new Promise((resolve) => {
      const { requestMembers } = getModule(['requestMembers'], false);
      requestMembers(guildId);

      function onReceived(e) {
        if (e.guildId === guildId) {
          let membersOnline = e.groups.map(group => group.count).reduce((a, b) => {
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
    const menu = await getModule(['MenuItem']);
    const mdl = await getModule(m => m.default && m.default.displayName === 'GuildContextMenu');

    const requestMemberData = (guildId) => {
      return this.requestMemberData(guildId);
    }

    inject('guild-profile', mdl, 'default', ([{ target, guild }], res) => {
      if (target.tagName.toLowerCase() === 'a') {
        res.props.children.splice(0, 0,
          React.createElement(menu.MenuItem, {
            id: 'guild-profile',
            label: Messages.GUILD_PROFILE,
            action: () => open(() => React.createElement(GuildProfileModal, { guild, section: 'GUILD_INFO', requestMemberData }))
          })
        );
      }
      return res;
    });
    mdl.default.displayName = 'GuildContextMenu';
  }

  pluginWillUnload() {
    uninject('guild-profile');
  }
}