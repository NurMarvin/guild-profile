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
const { AdvancedScrollerThin } = getModule(['AdvancedScrollerThin'], false);
const { Clickable, Spinner } = require('powercord/components');
const AsyncComponent = require('powercord/components/AsyncComponent');
const DiscordTag = AsyncComponent.from(getModuleByDisplayName('DiscordTag'));
const { default: Avatar } = getModule(['AnimatedAvatar'], false);
const { close } = require('powercord/modal');

const ContextMenu = getModule(['closeContextMenu'], false);

const UserProfileModalActionCreators = getModule(
  ['openUserProfileModal'],
  false
);

class RelationshipRow extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(['listRow'], false),
    };
  }

  render() {
    const { user, status, onSelect, onContextMenu } = this.props;

    return (
      <Clickable
        className={this.modules.listRow}
        onClick={() => onSelect(user.id)}
        onContextMenu={() => onContextMenu(user.id)}
      >
        <Avatar
          className={this.modules.listAvatar}
          src={user.getAvatarURL()}
          size='SIZE_40'
          status={status}
        />
        <DiscordTag
          user={user}
          className={this.modules.listName}
          discriminatorClass={this.modules.listDiscriminator}
        />
      </Clickable>
    );
  }
}

module.exports = class Relationships extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = {
      nelly: getModule(['flexWrapper', 'image'], false).image,
      ...getModule(['emptyIconFriends'], false),
      ...getModule(['scrollerBase', 'fade', 'thin'], false),
    };
  }

  handleSelect(userId) {
    close();
    UserProfileModalActionCreators.openUserProfileModal({ userId });
  }

  render() {
    const { relationships, section } = this.props;

    if (!relationships) {
      return (
        <div className={this.modules.empty}>
          <Spinner />
        </div>
      );
    } else if (relationships.length < 1) {
      return (
        <div className={this.modules.empty}>
          <div className={this.modules.emptyIconFriends} />
          <div className={this.modules.emptyText}>
            {Messages[`NO_${section}_IN_THIS_GUILD`]}
          </div>
        </div>
      );
    }
    return (
      <AdvancedScrollerThin
        fade={true}
        className={[this.modules.listScroller].join(' ')}
      >
        {relationships.map((relationship) => (
          <RelationshipRow
            onSelect={this.handleSelect}
            onContextMenu={(event) =>
              ContextMenu.openContextMenu(event, () => {})
            }
            user={relationship}
          />
        ))}
      </AdvancedScrollerThin>
    );
  }
};
