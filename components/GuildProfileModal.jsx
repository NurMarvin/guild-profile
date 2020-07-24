const {
  React,
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
} = require('powercord/components');
const { clipboard } = window.require('electron');
const AsyncComponent = require('powercord/components/AsyncComponent');

const VerticalScroller = AsyncComponent.from(
  getModuleByDisplayName('VerticalScroller')
);
const FormSection = AsyncComponent.from(getModuleByDisplayName('FormSection'));
const GuildBadge = AsyncComponent.from(getModuleByDisplayName('GuildBadge'));
const Anchor = AsyncComponent.from(getModuleByDisplayName('Anchor'));

const InviteButton = AsyncComponent.from(
  getModuleByDisplayName('InviteButton')
);

getModuleByDisplayName('InviteButton', true, true).then((Button) => {
  ['Data'].forEach((prop) => (InviteButton[prop] = Button[prop]));
});

const { GuildIcon } = getModule(['GuildIcon'], false);

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
      ...getModule(['marginBottom8'], false),
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
    const { streamerMode } = this.state;

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
      <VerticalScroller className='guild-profile' fade={true}>
        <Flex justify={Flex.Justify.START} wrap={Flex.Wrap.WRAP}>
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
          <Section title={Messages.FORM_LABEL_VERIFICATION_LEVEL}>
            {Messages[GuildVerificationLevels[verificationLevel]]}
          </Section>
          <Section title={Messages.FORM_LABEL_EXPLICIT_CONTENT_FILTER}>
            {Messages[GuildExplicitContentFilterTypes[explicitContentFilter]]}
          </Section>
          <Section title={Messages.CREATED_AT}>
            {moment(extractTimestamp(guild.id)).format('LLL')}
          </Section>
          <Section title={Messages.JOINED_AT}>
            {moment(guild.joinedAt).format('LLL')}
          </Section>
        </Flex>
      </VerticalScroller>
    );
  }
}

module.exports = class GuildProfileModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.classes = {
      ...getModule(['guildDetail'], false),
      ...getModule(['tabBarContainer'], false),
      guildIconContainer: getModule(['guildIconContainer'], false)
        .guildIconContainer,
      avatarWrapperNormal: getModule(['avatarWrapperNormal'], false)
        .avatarWrapperNormal,
    };

    this.state = {};
  }

  async componentDidMount() {
    const { guild, requestMemberData } = this.props;
    const memberData = await requestMemberData(guild.id);
    this.setState({ counts: memberData });
  }

  render() {
    const { guild, section: selectedSection } = this.props;
    const { counts } = this.state;

    let component;
    const props = {};

    switch (selectedSection) {
      case GuildProfileSections.FRIENDS:
        break;
      case GuildProfileSections.BLOCKED_USERS:
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

    return (
      <Flex className={this.classes.root} direction={Flex.Direction.VERTICAL}>
        <div className={this.classes.topSectionNormal}>
          <header className={this.classes.header}>
            <Clickable
              className={this.classes.avatarWrapperNormal}
              onClick={() =>
                clipboard.writeText(
                  `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=1024`
                )
              }
            >
              <Tooltip
                position='top'
                text={Messages.CLICK_TO_COPY_SERVER_ICON_URL}
              >
                <GuildIcon
                  className={`${this.classes.avatar} guild-icon-avatar-size`}
                  guild={guild}
                />
              </Tooltip>
            </Clickable>
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
                      members={counts.members}
                      membersOnline={counts.membersOnline}
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
                  color='#4f545c'
                  className={this.classes.tabBarItem}
                  id={GuildProfileSections.FRIENDS}
                >
                  <Tooltip text={Messages.NOT_IMPLEMENTED_YET} position='top'>
                    {Messages.FRIENDS_IN_GUILD}
                  </Tooltip>
                </TabBar.Item>
                <TabBar.Item
                  color='#4f545c'
                  className={this.classes.tabBarItem}
                  id={GuildProfileSections.BLOCKED_USERS}
                >
                  <Tooltip text={Messages.NOT_IMPLEMENTED_YET} position='top'>
                    {Messages.BLOCKED_USERS_IN_GUILD}
                  </Tooltip>
                </TabBar.Item>
              </TabBar>
            </div>
          </div>
        </div>
        <div className={this.classes.body}>
          {React.createElement(component, props)}
        </div>
      </Flex>
    );
  }
};
