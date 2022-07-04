/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  i18n: { Messages },
  Flux,
  getModule,
} = require('powercord/webpack');

const { ModalRoot } = getModule(['ModalRoot'], false);

const GuildProfileHeader = require('./GuildProfileHeader');
const GuildRelationships = require('./GuildRelationships');
const GuildInfoBase = require('./GuildInfoBase');

const { TabBar } = require('powercord/components');

const GuildProfileSections = {
  GUILD_INFO: 'GUILD_INFO',
  FRIENDS: 'FRIENDS',
  BLOCKED_USERS: 'BLOCKED_USERS',
};

class GuildProfileTabBar extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule([ 'top', 'item' ], false),
      ...getModule([ 'tabBarContainer', 'tabBarItemSpacing' ], false),
    };
  }
  render() {
    const { setSection, section } = this.props;

    return (
      <div className={this.modules.tabBarContainer}>
        <TabBar
          className={this.modules.tabBar}
          selectedItem={section}
          type={TabBar.Types.TOP}
          onItemSelect={setSection}
        >
          <TabBar.Item
            className={this.modules.tabBarItem}
            id={GuildProfileSections.GUILD_INFO}
          >
            {Messages.GUILD_INFO}
          </TabBar.Item>
          <TabBar.Item
            className={this.modules.tabBarItem}
            id={GuildProfileSections.FRIENDS}
          >
            {Messages.FRIENDS_IN_GUILD}
          </TabBar.Item>
          <TabBar.Item
            className={this.modules.tabBarItem}
            id={GuildProfileSections.BLOCKED_USERS}
          >
            {Messages.BLOCKED_USERS_IN_GUILD}
          </TabBar.Item>
        </TabBar>
      </div>
    );
  }
}

class GuildProfileModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule([ 'top', 'item' ], false),
      ...getModule([ 'tabBarContainer', 'tabBarItemSpacing' ], false)
    };

    this.state = {
      section: GuildProfileSections.GUILD_INFO,
    };
  }

  async componentDidMount() {
    const { guild, getMemberCounts } = this.props;
    const memberData = await getMemberCounts(guild.id);
    this.setState({ counts: memberData });
  }

  render() {
    const { guild } = this.props;
    const { counts } = this.state;

    let section;

    switch (this.state.section) {
      case GuildProfileSections.GUILD_INFO:
        section = <GuildInfoBase guild={guild} />;
        break;
      case GuildProfileSections.FRIENDS:
        section = (
          <GuildRelationships
            section={this.state.section}
            relationships={this.props.friends}
          />
        );
        break;
      case GuildProfileSections.BLOCKED_USERS:
        section = (
          <GuildRelationships
            section={this.state.section}
            relationships={this.props.blocked}
          />
        );
        break;
    }

    return (
      <ModalRoot className="guild-profile-root" transitionState={1}>
        <div className="guild-profile-topsection">
          <GuildProfileHeader guild={guild} counts={counts} />
          <GuildProfileTabBar
            setSection={(section) => this.setState({ section })}
            section={this.state.section}
            guild={guild}
          />
        </div>
        <div className="guild-profile-body">{section}</div>
      </ModalRoot>
    );
  }
}

module.exports = Flux.connectStoresAsync(
  [
    getModule(['getRelationships']),
    getModule(['getCurrentUser', 'getUser']),
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
