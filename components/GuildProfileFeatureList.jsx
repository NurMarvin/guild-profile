/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  getModule,
  i18n: { Messages },
} = require("powercord/webpack");

const { Tooltip, Clickable } = require("powercord/components");

const Icons = require("./Icons");

module.exports = class GuildProfileFeatureList extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(["container", "clickable", "profileBadge"], false),
      theme: getModule(["theme"], false).theme,
    };
  }

  render() {
    const { guild, className } = this.props;

    // TODO: Remove before release
    // guild.features = new Set([
    //   "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE",
    //   "WELCOME_SCREEN_ENABLED",
    //   "NEWS",
    //   "COMMUNITY",
    //   "MEMBER_VERIFICATION_GATE_ENABLED",
    //   "PRIVATE_THREADS",
    //   "PREVIEW_ENABLED",
    //   "SEVEN_DAY_THREAD_ARCHIVE",
    //   "THREADS_ENABLED",
    //   "THREADS_ENABLED_TESTING",
    //   "THREE_DAY_THREAD_ARCHIVE",
    //   "VANITY_URL",
    //   "PARTNERED",
    //   "MONETIZATION_ENABLED",
    //   "COMMERCE",
    //   "ANIMATED_BANNER",
    //   "BANNER",
    //   "ROLE_ICONS",
    //   "ANIMATED_ICON",
    //   "MEMBER_PROFILES",
    //   "VIP_REGIONS",
    //   "ENABLED_DISCOVERABLE_BEFORE",
    //   "MORE_EMOJI",
    //   "VERIFIED",
    //   "FEATURABLE",
    //   "HAS_DIRECTORY_ENTRY",
    //   "INVITE_SPLASH",
    //   "DISCOVERABLE",
    //   "NEW_THREAD_PERMISSIONS",
    //   "CHANNEL_BANNER",
    //   "TEXT_IN_VOICE_ENABLED",
    //   "ROLE_SUBSCRIPTIONS_ENABLED_FOR_PURCHASE",
    //   "ROLE_SUBSCRIPTIONS_ENABLED",
    //   "PREMIUM_TIER_3_OVERRIDE",
    //   "MORE_STICKERS",
    //   "RELAY_ENABLED",
    //   "INTERNAL_EMPLOYEE_ONLY",
    //   "FORCE_RELAY",
    //   "TICKETING_ENABLED",
    //   "EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT",
    //   "LINKED_TO_HUB",
    //   "AUTO_MODERATION",
    //   "BOOSTING_TIERS_EXPERIMENT_SMALL_GUILD",
    //   "BOOSTING_TIERS_EXPERIMENT_MEDIUM_GUILD",
    //   "HAD_EARLY_ACTIVITIES_ACCESS",
    //   "TICKETED_EVENTS_ENABLED",
    //   "BOT_DEVELOPER_EARLY_ACCESS",
    //   "GUILD_HOME_TEST",
    // ]);

    return (
      <div
        aria-label="Guild Features"
        role="group"
        className={[className, this.modules.container].join(" ")}
      >
        {Array.from(guild.features)
          .filter(
            (feature) => feature !== "VERIFIED" && feature !== "PARTNERED"
          )
          .map((feature) => {
            const Icon = Icons[feature] ?? Icons.UNKNOWN;

            return (
              <Clickable
                onClick={() =>
                  window.open(
                    `https://github.com/Delitefully/DiscordLists#guild-feature-glossary:~:.-,text=${feature}`,
                    "_blank"
                  )
                }
                className={this.modules.clickable}
              >
                <Tooltip
                  key={feature.toLowerCase()}
                  spacing={24}
                  color="primary"
                  text={Messages[feature] || feature}
                >
                  <Icon
                    className={[
                      guild.features.size > 14
                        ? this.modules.profileBadge18
                        : this.modules.profileBadge24,
                      this.modules.profileBadge,
                      this.modules.desaturate,
                      "guild-profile-feature-badge",
                    ].join(" ")}
                  />
                </Tooltip>
              </Clickable>
            );
          })}
      </div>
    );
  }
};
