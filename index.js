/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { Plugin } = require("powercord/entities");
const { inject, uninject } = require("powercord/injector");
const {
  React,
  getModule,
  getModuleByDisplayName,
  FluxDispatcher,
  i18n: { Messages },
} = require("powercord/webpack");
const { open } = require("powercord/modal");
const { findInReactTree } = require("powercord/util");
const i18n = require("./i18n");

const GuildProfileModal = require("./components/GuildProfileModal");
const GuildProfileIcon = require("./components/GuildProfileIcon");

const memberCountsStore = require("./memberCountsStore/store");
const memberCountsActions = require("./memberCountsStore/actions");

const { getCurrentUser } = getModule(["getCurrentUser"], false);

module.exports = class GuildProfile extends Plugin {
  async startPlugin() {
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet("styles.scss");
    this._injectMenu();

    this.handleMemberListUpdate = this.handleMemberListUpdate.bind(this);

    FluxDispatcher.subscribe(
      "GUILD_MEMBER_LIST_UPDATE",
      this.handleMemberListUpdate
    );
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

      const { requestMembers } = getModule(["requestMembers"], false);
      requestMembers(id);

      const updateMemberCounts = (memberListUpdate) => {
        return this.updateMemberCounts(memberListUpdate);
      };

      function onReceived(memberListUpdate) {
        if (memberListUpdate.guildId === id) {
          resolve(updateMemberCounts(memberListUpdate));
        }
      }

      FluxDispatcher.subscribe("GUILD_MEMBER_LIST_UPDATE", onReceived);
    });
  }

  updateMemberCounts(memberListUpdate) {
    const { guildId, memberCount, groups } = memberListUpdate;
    const onlineCount = groups
      .map((group) => (group.id != "offline" ? group.count : 0))
      .reduce((a, b) => {
        return a + b;
      }, 0);
    const memberCounts = { guildId, memberCount, onlineCount };

    memberCountsActions.updateMemberCounts(memberCounts);
    return memberCounts;
  }

  async _injectMenu() {
    const id = "guild-profile";
    const Menu = await getModule(["MenuItem"]);
    const { getGuild } = await getModule(["getGuild"]);
    const { getGuildId } = await getModule(["getLastSelectedGuildId"]);

    const getMemberCounts = (guildId) => {
      return this.getMemberCounts(guildId);
    };

    inject("guild-profile-menu", Menu, "default", ([{ children }], res) => {
      const menuId = res.props.children.props.id;

      if (menuId !== "guild-header-popout" && menuId !== "guild-context")
        return res;

      if (!findInReactTree(res, (c) => c.props && c.props.id == id)) {
        children.unshift(
          React.createElement(
            Menu.MenuGroup,
            null,
            React.createElement(Menu.MenuItem, {
              id,
              label: Messages.GUILD_PROFILE,
              icon: () =>
                menuId === "guild-header-popout"
                  ? React.createElement(GuildProfileIcon)
                  : null,
              action: () =>
                this._openModalHandler(() =>
                  React.createElement(GuildProfileModal, {
                    guild: getGuild(getGuildId()),
                    section: "GUILD_INFO",
                    getMemberCounts,
                  })
                ),
            })
          )
        );
      }
      return res;
    });

    Menu.default.displayName = "Menu";
  }

  _openModalHandler(element) {
    const { openUserProfileModal } = getModule(["openUserProfileModal"], false);
    const module = getModule(["openModalLazy"], false);

    if (getModuleByDisplayName("UserProfileModal", false) !== null) {
      open(element);
      return;
    }

    // So, the modules that are needed to render our modal are in another chunk, which is still not loaded.
    // We call a function that loads modules for UserProfileModal,
    // but the user will not see the final UserProfileModal -
    // since it will be replaced at the last stage with our element

    const { ModalRoot } = getModule(["ModalRoot"], false);
    const userId = getCurrentUser().id;

    inject(
      "guild-profile-open-modal-lazy",
      module,
      "openModalLazy",
      ([initLazyRender]) => {
        const warpInitLazyRender = () => {
          const lazyRender = initLazyRender();

          return new Promise(async (resolve) => {
            const render = await lazyRender;

            resolve((event) => {
              const res = render(event);

              if (res?.type?.displayName === "UserProfileModal") {
                const { props } = res;
                const { root } = getModule(["root", "body"], false);

                if (props.guildId === "@me" && props.user.id === userId) {
                  if (props.transitionState === 3) {
                    // = close modal
                    uninject("guild-profile-open-modal-lazy");
                  }

                  return React.createElement(ModalRoot, {
                    transitionState: props.transitionState,
                    className: root,
                    children: element(),
                  });
                }
              }
              return res;
            });
          });
        };

        return [warpInitLazyRender];
      },
      true
    );

    openUserProfileModal({ userId });
  }

  pluginWillUnload() {
    uninject("guild-profile-context-menu");
    uninject("guild-profile-context-lazy-menu");
    uninject("guild-profile-open-modal-lazy");
    uninject("guild-profile-menu");
    FluxDispatcher.unsubscribe(
      "GUILD_MEMBER_LIST_UPDATE",
      this.handleMemberListUpdate
    );
  }
};
