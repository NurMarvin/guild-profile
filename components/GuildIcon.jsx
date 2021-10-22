/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { React, getModule } = require('powercord/webpack');

module.exports = class GuildIcon extends React.PureComponent {
  constructor(props) {
    super(props);

    const { wrapper, avatar, avatarStack } = getModule(
      ['avatar', 'wrapper', 'avatarStack'],
      false
    );

    this.modules = {
      acronym: getModule(['childWrapper', 'acronym'], false).acronym,
      wrapper,
      avatarStack,
      realAvatar: avatar,
      ...getModule(['headerTop', 'avatar', 'badgeList'], false),
      ...getModule(['getGuildIconURL'], false),
    };
  }

  render() {
    const { guild } = this.props;

    return (
      <div className={[this.modules.avatar, this.modules.wrapper].join(' ')}>
        <div style={{ width: '120px', height: '120px' }}>
          <div className={this.modules.avatarStack}>
            {guild.icon ? (
              <img
                alt=' '
                src={this.modules.getGuildIconURL(guild)}
                className={this.modules.realAvatar}
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <div
                className={[this.modules.acronym, 'guild-icon-acronym'].join(
                  ' '
                )}
              >
                {guild.acronym}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};
