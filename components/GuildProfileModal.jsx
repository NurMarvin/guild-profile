/*
 * Copyright (c) 2020 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  Flux,
  getModule,
  i18n: { Messages },
  getModuleByDisplayName,
} = require('powercord/webpack');
const {
  Text,
  Flex,
  TabBar,
  Clickable,
  Tooltip,
  Spinner,
} = require('powercord/components');
const { close } = require('powercord/modal');
const { clipboard } = require('electron');
const AsyncComponent = require('powercord/components/AsyncComponent');

const { AdvancedScrollerThin } = getModule(['AdvancedScrollerThin'], false);
const FormSection = AsyncComponent.from(getModuleByDisplayName('FormSection'));
const GuildBadge = AsyncComponent.from(getModuleByDisplayName('GuildBadge'));
const Anchor = AsyncComponent.from(getModuleByDisplayName('Anchor'));
const Mention = AsyncComponent.from(getModuleByDisplayName('Anchor'));

const InviteButton = AsyncComponent.from(
  getModuleByDisplayName('InviteButton')
);

getModuleByDisplayName('InviteButton', true, true).then((Button) => {
  ['Data'].forEach((prop) => (InviteButton[prop] = Button[prop]));
});

const DiscordTag = AsyncComponent.from(getModuleByDisplayName('DiscordTag'));

const { GuildIcon } = getModule(['GuildIcon'], false);
const { Avatar } = getModule(['Avatar'], false);

const UserProfileModalActionCreators = getModule(
  ['fetchProfile', 'open'],
  false
);

const ContextMenu = getModule(['closeContextMenu'], false);

const GuildProfileSections = {
  GUILD_INFO: 'GUILD_INFO',
  FRIENDS: 'FRIENDS',
  BLOCKED_USERS: 'BLOCKED_USERS',
};

const GuildExplicitContentFilterTypes = [
  'EXPLICIT_CONTENT_FILTER_DISABLED',
  'EXPLICIT_CONTENT_FILTER_MEDIUM',
  'EXPLICIT_CONTENT_FILTER_HIGH',
];

const GuildVerificationLevels = [
  'VERIFICATION_LEVEL_NONE',
  'VERIFICATION_LEVEL_LOW',
  'VERIFICATION_LEVEL_MEDIUM',
  'VERIFICATION_LEVEL_HIGH',
  'VERIFICATION_LEVEL_VERY_HIGH',
];

module.exports = GuildProfileSections;

class Section extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      marginBottom8: getModule(['marginBottom8'], false).marginBottom8,
    };
  }

  render() {
    const { children, title } = this.props;

    if (!children) return null;

    return (
      <FormSection
        className={this.classes.marginBottom8 + ' guild-info-section'}
        tag='h5'
        title={title}
      >
        <Text selectable={true}>{children}</Text>
      </FormSection>
    );
  }
}

class RelationshipRow extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      ...getModule(['listRow'], false),
    };

    this.state = {};
  }

  render() {
    const { user, status, onSelect } = this.props;

    return (
      <Clickable
        className={this.classes.listRow}
        onClick={() => onSelect(user.id)}
        onSelect={() => onSelect(user.id)}
      >
        <Avatar
          className={this.classes.listAvatar}
          src={user.avatarURL}
          size='SIZE_40'
          status={status}
        />
        <DiscordTag
          user={user}
          className={this.classes.listName}
          discriminatorClass={this.classes.listDiscriminator}
        />
      </Clickable>
    );
  }
}

class Relationships extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      empty: getModule(['body', 'empty'], false).empty,
      nelly: getModule(['flexWrapper', 'image'], false).image,
      ...getModule(['emptyIconFriends'], false),
      ...getModule(['scrollerBase', 'fade', 'thin'], false),
    };
  }

  handleSelect(userId) {
    close();
    UserProfileModalActionCreators.open(userId);
  }

  render() {
    const { relationships, section } = this.props;

    if (!relationships) {
      return (
        <div className={this.classes.empty}>
          <Spinner />
        </div>
      );
    } else if (relationships.length < 1) {
      return (
        <div className={this.classes.empty}>
          <div className={this.classes.emptyIconFriends} />
          <div className={this.classes.emptyText}>
            {Messages[`NO_${section}_IN_THIS_GUILD`]}
          </div>
        </div>
      );
    } else {
      return (
        <AdvancedScrollerThin
          className={[
            this.classes.listScroller,
            this.classes.fade,
            this.classes.thin,
            this.classes.scrollerBase,
          ].join(' ')}
        >
          {relationships.map((relationShip) => (
            <RelationshipRow onSelect={this.handleSelect} user={relationShip} />
          ))}
        </AdvancedScrollerThin>
      );
    }
  }
}

class GuildInfo extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      empty: getModule(['body', 'empty'], false).empty,
      nelly: getModule(['flexWrapper', 'image'], false).image,
      ...getModule(['emptyIcon'], false),
    };

    this.state = {
      streamerMode: getModule(['hidePersonalInformation'], false)
        .hidePersonalInformation,
    };
  }

  async componentDidMount() {
    const { getUser } = getModule(['getUser'], false);
    const { ownerId } = this.props.guild;

    this.setState({ owner: await getUser(ownerId) });
  }

  handleContextMenu(event) {
    ContextMenu.openContextMenu(event, (props) => {});
  }

  render() {
    const moment = getModule(['momentProperties'], false);
    const { extractTimestamp } = getModule(['extractTimestamp'], false);
    const { guild } = this.props;
    const {
      vanityURLCode,
      description,
      verificationLevel,
      explicitContentFilter,
    } = guild;
    const { streamerMode, owner } = this.state;

    if (streamerMode) {
      return (
        <div className={this.classes.empty}>
          <div className={this.classes.emptyIconStreamerMode} />
          <div className={this.classes.emptyText}>
            {Messages.STREAMER_MODE_ENABLED}
          </div>
        </div>
      );
    }

    return (
      <AdvancedScrollerThin className='guild-profile' fade={true}>
        <Flex justify={Flex.Justify.START} wrap={Flex.Wrap.WRAP}>
          <Section title={Messages.GUILD_OWNER}>
            {owner ? (
              <Mention
                className='mention'
                onContextMenu={(e) => this.handleContextMenu(e)}
                onClick={() => UserProfileModalActionCreators.open(owner.id)}
              >
                @{owner.username}#{owner.discriminator}
              </Mention>
            ) : (
              Messages.LOADING + '...'
            )}
          </Section>
          <Section title={Messages.FORM_LABEL_SERVER_DESCRIPTION}>
            {description}
          </Section>
          {vanityURLCode && (
            <Section title={Messages.VANITY_URL}>
              <Anchor href={`https://discord.gg/${vanityURLCode}`}>
                discord.gg/{vanityURLCode}
              </Anchor>
            </Section>
          )}
          <Section title={Messages.CREATED_AT}>
            {moment(extractTimestamp(guild.id)).format('LLL')}
          </Section>
          <Section title={Messages.JOINED_AT}>
            {moment(guild.joinedAt).format('LLL')}
          </Section>
          <Section title={Messages.FORM_LABEL_VERIFICATION_LEVEL}>
            {Messages[GuildVerificationLevels[verificationLevel]]}
          </Section>
          <Section title={Messages.FORM_LABEL_EXPLICIT_CONTENT_FILTER}>
            {Messages[GuildExplicitContentFilterTypes[explicitContentFilter]]}
          </Section>
          <Section title={Messages.GUILD_PREMIUM_SUBSCRIBER_COUNT}>
            {guild.premiumSubscriberCount}
          </Section>
          <Section title={Messages.GUILD_PREMIUM_TIER}>
            {guild.premiumTier}
          </Section>
        </Flex>
      </AdvancedScrollerThin>
    );
  }
}

class GuildProfileModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      ...getModule(['guildDetail'], false),
      ...getModule(['tabBarContainer'], false),
      guildIconContainer: getModule(['guildIconContainer'], false)
        .guildIconContainer,
      avatarWrapperNormal: getModule(['avatarWrapperNormal'], false)
        .avatarWrapperNormal,
      ...getModule(['profileBadge'], false),
    };

    _.bindAll(this, ['handleSectionSelect']);

    this.state = {
      selectedSection: props.section,
    };
  }

  async componentDidMount() {
    const { guild, getMemberCounts } = this.props;
    const memberData = await getMemberCounts(guild.id);
    this.setState({ counts: memberData });
  }

  handleSectionSelect(selectedSection) {
    this.setState({ selectedSection });
  }

  render() {
    const { guild } = this.props;
    const { counts, selectedSection } = this.state;
    const { icon } = guild;

    let component;
    const props = {
      section: selectedSection,
    };

    switch (selectedSection) {
      case GuildProfileSections.FRIENDS:
        component = Relationships;
        props.relationships = this.props.friends;
        break;
      case GuildProfileSections.BLOCKED_USERS:
        component = Relationships;
        props.relationships = this.props.blocked;
        break;
      case GuildProfileSections.GUILD_INFO:
      default:
        component = GuildInfo;
        props.guild = this.props.guild;
        break;
    }

    const features = Array.from(guild.features)
      .filter((f) => f !== 'VERIFIED' && f !== 'PARTNERED')
      .map((f) => {
        return {
          name: f,
          className: 'profile-badge-' + f.toLowerCase().split('_').join('-'),
        };
      });

    const guildIcon = (
      <GuildIcon
        animate={true}
        className={'guild-icon-avatar-size'}
        guild={guild}
      />
    );

    return (
      <Flex className={this.classes.root} direction={Flex.Direction.VERTICAL}>
        <div className={this.classes.topSectionNormal}>
          <header className={this.classes.header}>
            {guild.icon ? (
              <Clickable
                className={this.classes.avatarWrapperNormal}
                onClick={() => {
                  const iconExt = icon.startsWith('a_') ? 'gif' : 'png';
                  clipboard.writeText(
                    `https://cdn.discordapp.com/icons/${guild.id}/${icon}.${iconExt}?size=1024`
                  );
                }}
              >
                <Tooltip
                  position='top'
                  className={this.classes.avatar}
                  text={Messages.CLICK_TO_COPY_SERVER_ICON_URL}
                >
                  {guildIcon}
                </Tooltip>
              </Clickable>
            ) : (
              guildIcon
            )}
            <div className={this.classes.headerInfo}>
              <div className={this.classes.nameTag}>
                <GuildBadge
                  size={20}
                  className={this.classes.guildIconContainer}
                  tooltipColor='black'
                  tooltipPosition='top'
                  guild={guild}
                />
                <span className={this.classes.username}>{guild.name}</span>
              </div>
              {features.length > 0 && (
                <Flex className={this.classes.profileBadges}>
                  {features.map((feature) => {
                    return (
                      <Tooltip
                        className={this.classes.profileBadgeWrapper}
                        position='top'
                        text={Messages[feature.name]}
                      >
                        <Clickable role='button' tag='div'>
                          <div
                            className={`${this.classes.profileBadge} ${feature.className}`}
                          />
                        </Clickable>
                      </Tooltip>
                    );
                  })}
                </Flex>
              )}
              <Flex className={this.classes.profileBadges}>
                <Text className={this.classes.guildDetail}>
                  {counts ? (
                    <InviteButton.Data
                      members={counts.memberCount}
                      membersOnline={counts.onlineCount}
                    />
                  ) : (
                    Messages.LOADING + '...'
                  )}
                </Text>
              </Flex>
            </div>
          </header>
          <div>
            <div className={this.classes.tabBarContainer}>
              <TabBar
                className={this.classes.tabBar}
                selectedItem={selectedSection}
                type={TabBar.Types.TOP}
                onItemSelect={this.handleSectionSelect}
              >
                <TabBar.Item
                  className={this.classes.tabBarItem}
                  id={GuildProfileSections.GUILD_INFO}
                >
                  {Messages.GUILD_INFO}
                </TabBar.Item>
                <TabBar.Item
                  className={this.classes.tabBarItem}
                  id={GuildProfileSections.FRIENDS}
                >
                  {Messages.FRIENDS_IN_GUILD}
                </TabBar.Item>
                <TabBar.Item
                  className={this.classes.tabBarItem}
                  id={GuildProfileSections.BLOCKED_USERS}
                >
                  {Messages.BLOCKED_USERS_IN_GUILD}
                </TabBar.Item>
              </TabBar>
            </div>
          </div>
        </div>
        <div className={this.classes.body}>
          {React.createElement(component || 'div', props)}
        </div>
      </Flex>
    );
  }
}

module.exports = Flux.connectStoresAsync(
  [
    getModule(['getRelationships']),
    getModule(['getCurrentUser']),
    getModule(['isMember']),
  ],
  ([relationshipsStore, userStore, membersStore], compProps) => {
    // Its safe to assume if the module aboves were found that this one is also loaded
    const userFetcher = getModule(['getUser'], false);
    const relationships = relationshipsStore.getRelationships();
    const props = {
      friends: [],
      blocked: [],
    };

    for (const userId in relationships) {
      if (!membersStore.isMember(compProps.guild.id, userId)) {
        continue;
      }

      const relationshipType = relationships[userId];
      const user = userStore.getUser(userId);
      if (!user) {
        userFetcher.getUser(userId);
        continue;
      }

      if (relationshipType === 1) {
        props.friends.push(user);
      } else if (relationshipType === 2) {
        props.blocked.push(user);
      }
    }
    return props;
  }
)(GuildProfileModal);
