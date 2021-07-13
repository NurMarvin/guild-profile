/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const {
  React,
  getModule,
  i18n: { Messages },
} = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

const { TextBadge } = getModule(['TextBadge'], false);
const { Colors } = getModule(['Colors'], false);

module.exports = class GuildBanner extends React.PureComponent {
  state = {
    color: null,
  };

  constructor(props) {
    super(props);

    this.modules = {
      ...getModule(['profileBannerPremium', 'profileBanner'], false),
      getPrimaryColor: getModule(['getPrimaryColorForAvatar'], false)
        .getPrimaryColorForAvatar,
      getGuildIconURL: getModule(['getGuildIconURL'], false).getGuildIconURL,
      getGuildBannerURL: getModule(['getGuildBannerURL'], false)
        .getGuildBannerURL,
    };
  }

  async componentDidMount() {
    const { guild } = this.props;

    let color = Colors.BRAND;

    if (guild.icon) {
      color = `rgb(${(
        await this.modules.getPrimaryColor(this.modules.getGuildIconURL(guild))
      ).join(', ')})`;
    }

    this.setState({ color });
  }

  render() {
    const { guild } = this.props;
    const { color } = this.state;

    if (!color) return null;

    const classes = [this.modules.banner];
    const style = {
      backgroundColor: color,
    };

    if (guild.banner) {
      classes.push(
        this.modules.profileBannerPremium,
        this.modules.bannerPremium
      );

      style.backgroundImage = `url(${this.modules.getGuildBannerURL(guild)})`;
    } else {
      classes.push(this.modules.profileBanner);
    }

    return (
      <div style={style} className={classes.join(' ')}>
        <Tooltip
          text={Messages.EXCLUSIVE_TO_SERVER_BANNER_FEATURE}
          className={this.modules.premiumIconWrapper}
        >
          {guild.banner && (
            <TextBadge
              color='rgba(32, 34, 37, 0.8)'
              text={
                <svg
                  className={this.modules.premiumIcon}
                  aria-hidden='false'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                >
                  <path
                    d='M11.9997 2L5.33301 8.66667V15.3333L11.9997 22L18.6663 15.3333V8.66667L11.9997 2ZM16.9997 14.65L11.9997 19.65L6.99967 14.65V9.35L11.9997 4.35L16.9997 9.35V14.65Z'
                    fill='currentColor'
                  />
                  <path
                    d='M8.66699 10.0501V13.9501L12.0003 17.2835L15.3337 13.9501V10.0501L12.0003 6.7168L8.66699 10.0501Z'
                    fill='currentColor'
                  />
                </svg>
              }
            />
          )}
        </Tooltip>
      </div>
    );
  }
};
