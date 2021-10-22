/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  getModule,
  i18n: { Messages },
  getModuleByDisplayName,
} = require('powercord/webpack');

const { Text } = require('powercord/components');
const AsyncComponent = require('powercord/components/AsyncComponent');

const inviteModule = getModule((m) => m.displayName === 'InviteButton' && m.Header)
const GuildBadge = AsyncComponent.from(getModuleByDisplayName('GuildBadge'));
const InviteButton = AsyncComponent.from(inviteModule);

inviteModule.then((Button) => {
  ['Data'].forEach((prop) => (InviteButton[prop] = Button[prop]));
});

const GuildBanner = require('./GuildBanner');
const GuildIcon = require('./GuildIcon');
const GuildProfileFeatureList = require('./GuildProfileFeatureList');

module.exports = class GuildProfileHeader extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(['guildDetail'], false),
      ...getModule(['topSection'], false),
      ...getModule(['wrapper', 'pointer'], false),
      ...getModule(['guildIconContainer', 'guildBadge'], false),
      ...getModule(['headerTop', 'avatar', 'badgeList'], false),
    };
  }
  render() {
    const { guild, counts } = this.props;

    return (
      <header>
        <GuildBanner guild={guild} />
        <div className={this.modules.header}>
          <GuildIcon guild={guild} />
          <div className={this.modules.headerTop}>
            <GuildProfileFeatureList
              className={this.modules.badgeList}
              guild={guild}
            />
          </div>
        </div>
        <div
          className={[
            this.modules.nameTagWithCustomStatus,
            this.modules.nameTag,
          ].join(' ')}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <GuildBadge
            size={20}
            className={this.modules.guildIconContainer}
            tooltipColor='primary'
            tooltipPosition='top'
            guild={guild}
          />
          <span className={this.modules.username}>{guild.name}</span>
        </div>
        <Text
          className={[
            this.modules.guildDetail,
            this.modules.customStatusActivity,
          ].join(' ')}
        >
          {counts ? (
            <InviteButton.Data
              members={counts.memberCount}
              membersOnline={counts.onlineCount}
            />
          ) : (
            `${Messages.LOADING}...`
          )}
        </Text>
      </header>
    );
  }
};
