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
