/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const {
  React,
  getModule,
  getModuleByDisplayName,
  FluxDispatcher,
  i18n: { Messages },
} = require('powercord/webpack');
const { open } = require('powercord/modal');
const { findInReactTree } = require('powercord/util');
const i18n = require('./i18n');

const GuildProfileModal = require('./components/GuildProfileModal');
const GuildProfileIcon = require('./components/GuildProfileIcon');

const memberCountsStore = require('./memberCountsStore/store');
const memberCountsActions = require('./memberCountsStore/actions');

const { getCurrentUser } = getModule(['getCurrentUser'], false);

module.exports = class GuildProfile extends Plugin {
  async startPlugin() {
    this.log('Icons provided by https://iconify.design/');
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('styles.scss');
    this._injectOpenContextMenuLazy({
      GuildContextMenu: this._injectContextMenu.bind(this)
    });
    this._injectMenu();

    this.lazyLoadClassModules.bind(this)();

    this.handleMemberListUpdate = this.handleMemberListUpdate.bind(this);

    FluxDispatcher.subscribe(
      'GUILD_MEMBER_LIST_UPDATE',
      this.handleMemberListUpdate
    );
  }

  lazyClasses = [
    ['infoScroller'],
    ['emptyIconFriends', 'empty'],
    ['headerTop', 'avatar', 'badgeList'],
    ['responsiveWidthMobile', 'topSection'],
  ];

  lazyLoadClassModules() {
    const lazyClasses = this.lazyClasses.filter(props => !getModule(props, false));

    // Powercord doesn't provide the full webpack require instance object sadly.
    const req = webpackChunkdiscord_app.push([[Symbol()], [], _ => _]);

    let modules = [];
    for (const id in req.m) {
      const module = req.m[id].toString();

      for (const props of lazyClasses) {
        if (props.every(p => ~module.indexOf(p))) {
          modules.push(id);
        }
      }
    }

    modules.forEach(req);
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
      };

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
    const onlineCount = groups
      .map((group) => (group.id != 'offline' ? group.count : 0))
      .reduce((a, b) => {
        return a + b;
      }, 0);
    const memberCounts = { guildId, memberCount, onlineCount };

    memberCountsActions.updateMemberCounts(memberCounts);
    return memberCounts;
  }

  _injectContextMenu() {
    const { MenuGroup, MenuItem } = getModule(['MenuItem'], false);
    const GuildContextMenu = getModule(
      (m) => m.default && m.default.displayName === 'GuildContextMenu', false
    );

    const getMemberCounts = (guildId) => {
      return this.getMemberCounts(guildId);
    };

    inject(
      'guild-profile-context-menu',
      GuildContextMenu,
      'default',
      ([{ guild }], res) => {
        res.props.children.splice(
          0,
          0,
          React.createElement(
            MenuGroup,
            {},
            React.createElement(MenuItem, {
              id: 'guild-profile',
              key: 'guild-profile',
              label: Messages.GUILD_PROFILE,
              action: () =>
                this._openModalHandler(() =>
                  React.createElement(GuildProfileModal, {
                    guild,
                    section: 'GUILD_INFO',
                    getMemberCounts
                  })
                )
            })
          )
        );
        return res;
      }
    );
    GuildContextMenu.default.displayName = 'GuildContextMenu';
  }

  async _injectMenu() {
    const id = 'guild-profile';
    const Menu = await getModule(['MenuItem']);
    const { getGuild } = await getModule(['getGuild']);
    const { getGuildId } = await getModule(['getLastSelectedGuildId']);

    const getMemberCounts = (guildId) => {
      return this.getMemberCounts(guildId);
    };

    inject('guild-profile-menu', Menu, 'default', ([{ children }], res) => {
      if (res.props.children.props.id !== 'guild-header-popout') return res;

      if (!findInReactTree(res, (c) => c.props && c.props.id == id)) {
        children.unshift(
          React.createElement(
            Menu.MenuGroup,
            null,
            React.createElement(Menu.MenuItem, {
              id,
              label: Messages.GUILD_PROFILE,
              icon: () => React.createElement(GuildProfileIcon),
              action: () =>
                this._openModalHandler(() =>
                  React.createElement(GuildProfileModal, {
                    guild: getGuild(getGuildId()),
                    section: 'GUILD_INFO',
                    getMemberCounts
                  })
                )
            })
          )
        );
      }
      return res;
    });
    Menu.default.displayName = 'Menu';
  }

  _injectOpenContextMenuLazy(menus) {
    const module = getModule(['openContextMenuLazy'], false);

    inject('guild-profile-context-lazy-menu', module, 'openContextMenuLazy', ([event, lazyRender, params]) => {
      const warpLazyRender = async () => {
        const render = await lazyRender(event);

        return (config) => {
          const menu = render(config);
          const CMName = menu?.type?.displayName;

          if (CMName) {
            const moduleByDisplayName = getModuleByDisplayName(CMName, false);

            if (CMName in menus) {
              menus[CMName]();
              delete menus[CMName];
            }
            if (moduleByDisplayName !== null) {
              menu.type = moduleByDisplayName;
            }
          }
          return menu;
        };
      };

      return [event, warpLazyRender, params];
    }, true);
  }

  _openModalHandler(element) {
    const { openUserProfileModal } = getModule(['openUserProfileModal'], false);
    const module = getModule(['openModalLazy'], false);

    if (getModuleByDisplayName('UserProfileModal', false) !== null) {
      open(element);
      return;
    }

    // So, the modules that are needed to render our modal are in another chunk, which is still not loaded.
    // We call a function that loads modules for UserProfileModal,
    // but the user will not see the final UserProfileModal -
    // since it will be replaced at the last stage with our element

    const { ModalRoot } = getModule(['ModalRoot'], false);
    const userId = getCurrentUser().id;

    inject('guild-profile-open-modal-lazy', module, 'openModalLazy', ([initLazyRender]) => {
      const warpInitLazyRender = () => {
        const lazyRender = initLazyRender();

        return new Promise(async (resolve) => {
          const render = await lazyRender;

          resolve((event) => {
            const res = render(event);

            if (res?.type?.displayName === 'UserProfileModal') {
              const { props } = res;
              const { root } = getModule(['root', 'body'], false);

              if (props.guildId === '@me' && props.user.id === userId) {
                if (props.transitionState === 3) { // = close modal
                  uninject('guild-profile-open-modal-lazy');
                }

                return React.createElement(ModalRoot, {
                  transitionState: props.transitionState,
                  className: root,
                  children: element()
                });
              }
            }
            return res;
          });
        });
      };

      return [warpInitLazyRender];
    }, true);

    openUserProfileModal({ userId });
  }

  pluginWillUnload() {
    uninject('guild-profile-context-menu');
    uninject('guild-profile-context-lazy-menu');
    uninject('guild-profile-open-modal-lazy');
    uninject('guild-profile-menu');
    FluxDispatcher.unsubscribe(
      'GUILD_MEMBER_LIST_UPDATE',
      this.handleMemberListUpdate
    );
  }
};
