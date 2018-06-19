/* eslint no-void: 0 */

const privacy = {
  publicProfile: { type: Boolean },
  hideDisplayName: { type: Boolean },
  hideUsername: { type: Boolean },
  hideAvatar: { type: Boolean },
  sharedProfile: { type: Boolean },
  sharedWatchlist: { type: Boolean }, // this is one would be custom
  sharedHistory: { type: Boolean }, // this one you can break out into an object, how?
};

export default privacy;
