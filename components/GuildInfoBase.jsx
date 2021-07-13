/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  i18n: { Messages },
  getModule,
  getModuleByDisplayName,
} = require('powercord/webpack');

const { Flex, Text } = require('powercord/components');
const AsyncComponent = require('powercord/components/AsyncComponent');

const FormSection = AsyncComponent.from(getModuleByDisplayName('FormSection'));
const Anchor = AsyncComponent.from(getModuleByDisplayName('Anchor'));
const Mention = AsyncComponent.from(getModuleByDisplayName('Mention'));

const { AdvancedScrollerThin } = getModule(['AdvancedScrollerThin'], false);

const ContextMenu = getModule(['closeContextMenu'], false);
const { close } = require('powercord/modal');

const UserProfileModalActionCreators = getModule(
  ['openUserProfileModal'],
  false
);

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

const NsfwLevels = [
  'NSFW_LEVEL_DEFAULT',
  'NSFW_LEVEL_EXPLICIT',
  'NSFW_LEVEL_SAFE',
  'NSFW_LEVEL_AGE_RESTRICTED',
];

class Section extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      marginBottom8: getModule(['marginBottom8'], false).marginBottom8,
    };
  }

  render() {
    const { children, title } = this.props;

    if (!children) {
      return null;
    }

    return (
      <FormSection
        className={[this.modules.marginBottom8, 'guild-info-section'].join(' ')}
        tag='h5'
        title={title}
      >
        <Text selectable={true}>{children}</Text>
      </FormSection>
    );
  }
}

module.exports = class GuildInfoBase extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(['topSection'], false),
      ...getModule(['infoScroller'], false),
      ...getModule(['emptyIconFriends', 'empty'], false),
    };

    this.state = {};
  }

  async componentDidMount() {
    const { getUser } = getModule(['getUser'], false);
    const { ownerId } = this.props.guild;

    const { getSerializedState } = await getModule(['getSerializedState']);
    const { getRegisteredExperiments } = await getModule([
      'getRegisteredExperiments',
    ]);
    const { v3: murmurHash } = await getModule(['v3']);

    const { loadedGuildExperiments } = getSerializedState();
    const registeredExperiments = getRegisteredExperiments();

    const object = {};

    Object.keys(registeredExperiments).forEach(
      (experiment) => (object[murmurHash(experiment)] = experiment)
    );
    Object.entries(loadedGuildExperiments).forEach(
      ([key, value]) =>
        (loadedGuildExperiments[object[key]] = { ...value, hashKey: key })
    );

    const enabledExperiments = Object.keys(loadedGuildExperiments).filter(
      (k) => loadedGuildExperiments[k].hashKey != null && k != 'undefined'
    );
    const enabledGuildExperiments = {};
    const y = {};
    Object.keys(object).forEach((key) => {
      y[object[key]] = key;
    });
    enabledExperiments.forEach((k) => {
      enabledGuildExperiments[k] = loadedGuildExperiments[y[k]];
    });

    const { id } = this.props.guild;
    const experimentsEnabledForGuild = [];

    enabledExperiments.forEach((k) => {
      const d = enabledGuildExperiments[k];
      if (d.overrides[id] != undefined) {
        experimentsEnabledForGuild.push(k);
      }
    });

    this.setState({
      owner: await getUser(ownerId),
      experiments: experimentsEnabledForGuild,
    });
  }

  handleContextMenu(event) {
    ContextMenu.openContextMenu(event, () => {});
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
      nsfwLevel,
    } = guild;
    const { owner, experiments } = this.state;

    const streamerMode = getModule(
      ['hidePersonalInformation'],
      false
    ).hidePersonalInformation;

    if (streamerMode) {
      return (
        <div className={this.modules.empty}>
          <div className={this.modules.emptyIconStreamerMode} />
          <div className={this.modules.emptyText}>
            {Messages.STREAMER_MODE_ENABLED}
          </div>
        </div>
      );
    }

    return (
      <AdvancedScrollerThin
        className={[this.modules.infoScroller, 'guild-profile'].join(' ')}
        fade={true}
      >
        <Flex justify={Flex.Justify.START} wrap={Flex.Wrap.WRAP}>
          <Section title={Messages.GUILD_OWNER}>
            {owner ? (
              <Mention
                className='mention'
                onContextMenu={(e) => this.handleContextMenu(e)}
                onClick={() => {
                  close();
                  UserProfileModalActionCreators.openUserProfileModal({
                    userId: owner.id,
                  });
                }}
              >
                @{owner.username}#{owner.discriminator}
              </Mention>
            ) : (
              `${Messages.LOADING}...`
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
          <Section title={Messages.PREFERRED_LOCALE}>
            {guild.preferredLocale}
          </Section>
          <Section title={Messages.NSFW}>
            {Messages[NsfwLevels[nsfwLevel]]}
          </Section>
          <Section title={Messages.ENABLED_EXPERIMENTS}>
            {experiments && experiments.length > 0
              ? experiments.join(', ')
              : Messages.NONE}
          </Section>
        </Flex>
      </AdvancedScrollerThin>
    );
  }
};
