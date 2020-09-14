/*
 * Copyright (c) 2020 NurMarvin (Marvin Witt)
 * Licensed under the Open Software License version 3.0
 */

const { Flux, FluxDispatcher } = require('powercord/webpack');
const { FluxActions } = require('../constants');

const memberCounts = [];

function handleMemberCountsUpdate(memberCountsUpdate) {
  memberCounts.push(memberCountsUpdate);
}

class MemberCountsStore extends Flux.Store {
  getStore() {
    return {
      memberCounts,
    };
  }

  getAllMemberCounts() {
    return memberCounts;
  }

  getMemberCounts(guildId) {
    return memberCounts.find(memberCounts => memberCounts.guildId === guildId);
  }
}

module.exports = new MemberCountsStore(FluxDispatcher, {
  [FluxActions.UPDATE_MEMBER_COUNTS]: (guildId, members, membersOnline) => handleMemberCountsUpdate(guildId, members, membersOnline),
});