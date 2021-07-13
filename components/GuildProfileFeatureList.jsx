/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  getModule,
  i18n: { Messages },
} = require('powercord/webpack');

const { Tooltip, Clickable } = require('powercord/components');

module.exports = class GuildProfileFeatureList extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(['container', 'clickable', 'profileBadge'], false),
      theme: getModule(['theme'], false).theme,
    };
  }

  render() {
    const { guild, className } = this.props;

    return (
      <div
        aria-label='Guild Features'
        role='group'
        className={[className, this.modules.container].join(' ')}
      >
        {Array.from(guild.features)
          .filter(
            (feature) => feature !== 'VERIFIED' && feature !== 'PARTNERED'
          )
          .map((feature) => {
            return (
              <Tooltip
                key={feature.toLowerCase()}
                spacing={24}
                color='primary'
                text={Messages[feature] || feature}
              >
                <Clickable className={this.modules.clickable}>
                  <img
                    alt=' '
                    src={`https://raw.githubusercontent.com/NurMarvin/guild-profile/master/assets/${
                      this.modules.theme
                    }/${feature.toLowerCase().split('_').join('-')}.svg`}
                    className={[
                      this.modules.profileBadge24,
                      this.modules.profileBadge,
                      this.modules.desaturate,
                    ].join(' ')}
                  />
                </Clickable>
              </Tooltip>
            );
          })}
      </div>
    );
  }
};
