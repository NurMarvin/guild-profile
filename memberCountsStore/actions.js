/*
 * Copyright (c) 2020 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { FluxDispatcher } = require('powercord/webpack');
const { FluxActions } = require('../constants');

module.exports = {
  updateMemberCounts: async (memberCountsUpdate) => {
    FluxDispatcher.dirtyDispatch({
      type: FluxActions.UPDATE_MEMBER_COUNTS,
      ...memberCountsUpdate
    });
  }
}
