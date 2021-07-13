/*
 * Copyright (c) 2020 - 2021 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { React, getModule } = require('powercord/webpack');
const { icon } = getModule(['menu', 'icon'], false);

module.exports = React.memo((props) => (
  <svg
    className={icon}
    xmlns='http://www.w3.org/2000/svg'
    width={24}
    height={24}
    viewBox='0 0 24 24'
    {...props}
  >
    <path
      fill-rule='evenodd'
      clip-rule='evenodd'
      d='M21 3H3V21H21V3ZM17.4 6.6H6.6V8.4H17.4V6.6ZM6.6 10.2H17.4V12H6.6V10.2ZM13.8 13.8H6.6V15.6H13.8V13.8Z'
      fill='currentColor'
    />
  </svg>
));
