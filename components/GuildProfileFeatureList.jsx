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
