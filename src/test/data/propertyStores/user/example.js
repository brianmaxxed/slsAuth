const example = {
  _enabled: true,
  publicProfile: true,
  hideDisplayName: true,
  hideUsername: false,
  hideAvatar: true,
  sharedProfile: false,
  sharedWatchlist: true, // this is one would be custom
  sharedHistory: true, // this one you can break out into an object, how?
  testPrivacy: {
    _enabled: true, // <-required, it tells you whether a subcategory is enabled or not.
    subitem1: true,
    subItem2: true,
    subItem3: false,
    subItem4: true,
    sublist1: {
      _enabled: true,
      subItemA1: true,
      subItemA2: true,
      subItemA3: true,
      subItemA4: false,
      subItemA5: true,
    },
    sublist2: {
      _enabled: true,
      subItemA1: true,
      subItemA2: false,
      subItemA3: true,
      subItemA4: false,
      subItemA5: true,
    },
    sublist3: {
      _enabled: true,
      subItemA1: true,
      subItemA2: false,
      subItemA3: true,
      subItemA4: false,
      subItemA5: true,
    },
    sublist4: {
      _enabled: true,
      subItemB1: true,
      subItemB2: false,
      subItemB3: true,
      subItemB4: false,
      subItemB5: true,
    },
  },
  testPrivacyDisabled1: {
    _enabled: false, // <-required, it tells you whether a subcategory is enabled or not.
    subitem1: true,
    subItem2: true,
    subItem3: false,
    subItem4: true,
    sublist1: {
      _enabled: false,
      subItemA1: true,
      subItemA2: true,
      subItemA3: true,
      subItemA4: false,
      subItemA5: true,
    },
  },
  testPrivacyDisabled2: {
    _enabled: true, // <-required, it tells you whether a subcategory is enabled or not.
    subitem1: true,
    subItem2: true,
    subItem3: false,
    subItem4: true,
    sublist1: {
      _enabled: false,
      subItemA1: true,
      subItemA2: true,
      subItemA3: true,
      subItemA4: false,
      subItemA5: true,
    },
  },
};

export default example;
