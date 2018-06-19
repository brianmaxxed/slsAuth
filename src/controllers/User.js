import express from 'express';

import c from '../config/consts';
import sc from '../config/statusCodes';
import h, { asynced, authN } from '../utils/helper';
import log from '../utils/logger';

export default class User {
  static routes(u) {
    const r = express.Router();
    // ping with database activity.
    r.get('/ping', async (...p) => { await asynced(u, 'ping', p); });

    // user routes
    r.post('/login', async (...p) => { await asynced(u, 'login', p); });
    r.get('/logout', async (...p) => { await authN(u, 'logout', p); });
    r.get('/account', async (...p) => { await authN(u, 'myAccount', p); });
    r.get('/account/:id', async (...p) => { await authN(u, 'account', p); });
    r.post('/signup', async (...p) => { await asynced(u, 'signup', p); });
    r.get('/me', async (...p) => { await authN(u, 'getThisUser', p); });
    r.get('/get/:id', async (...p) => { await authN(u, 'getUser', p); });
    r.get('/list', async (...p) => { const out = await authN(u, 'getUsers', p); });
    r.patch('/offline', async (...p) => { await authN(u, 'setOffline', p); });
    r.patch('/delete', async (...p) => { await authN(u, 'setSoftDelete', p); });
    r.patch('/username', async (...p) => { await authN(u, 'updateUsername', p); });
    r.post('/resend/username', async (...p) => { await authN(u, 'resendUsername', p); });

    // password is a protected operation
    // To update the password (if user knows is old password and new password)
    r.put('/password', async (...p) => { await authN(u, 'updatePassword', p); });
    // submit password to verify access by bypassing token; authenticated users but extra secure
    r.post('/password/verify', async (...p) => { await authN(u, 'verifyPassword', p); });
    // this should send the password to the user's email or phone
    r.post('/password/resend', async (...p) => { await asynced(u, 'resendPassword', p); });
    // To reset the current password (in case user forget the password)
    r.delete('/password', async (...p) => { await asynced(u, 'resetPassword', p); });

    // contact routes
    r.post('/contact', async (...p) => { await authN(u, 'addContact', p); });
    r.put('/contact/:id', async (...p) => { await authN(u, 'updateContact', p); });
    r.delete('contact/:id', async (...p) => { await authN(u, 'deleteContact', p); });
    r.get('/contact/:id', async (...p) => { await authN(u, 'getContact', p); });
    r.get('/contacts', async (...p) => { await authN(u, 'getAllContacts', p); });
    r.patch('/contact/:id/email/code', async (...p) => { await authN(u, 'resendEmailVerifyCode', p); });
    r.patch('/contact/:id/email', async (...p) => { await authN(u, 'updateEmail', p); });
    r.patch('/contact/:id/email/verify', async (...p) => { await authN(u, 'verifyEmail', p); });
    r.get('/contact/email/verify/:email/:code', async (...p) => { await asynced(u, 'verifyEmailViaLink', p); });

    // profile routes
    r.post('/profile', async (...p) => { await authN(u, 'addProfile', p); });
    r.put('/profile/:id', async (...p) => { await authN(u, 'updateProfile', p); });
    r.delete('/profile/:id', async (...p) => { await authN(u, 'deleteProfile', p); });
    r.get('/profile/:id', async (...p) => { await authN(u, 'getProfile', p); });
    r.get('/profiles', async (...p) => { await authN(u, 'getAllProfiles', p); });

    // profile / device routes
    r.post('/device', async (...p) => { await authN(u, 'addDevice', p); });
    r.put('/device/:id', async (...p) => { await authN(u, 'updateDevice', p); });
    r.delete('/device/:id', async (...p) => { await authN(u, 'deleteDevice', p); });
    r.get('/device/:id', async (...p) => { await authN(u, 'getDevice', p); });
    r.get('/devices', async (...p) => { await authN(u, 'getAllDevices', p); });
    r.get('/devices/loggedin', async (...p) => { await authN(u, 'getLoggedinDevices', p); });
    r.post('/devices/logout-all-except/:id', async (...p) => { await authN(u, 'logoutDevicesExcept', p); });
    r.post('/devices/logout-all', async (...p) => { await authN(u, 'logoutAllDevices', p); });
    r.patch('/device/:id/activate', async (...p) => { await authN(u, 'activateDevice', p); });

    // settings routes
    r.patch('/setting', async (...p) => { await authN(u, 'updateSetting', p); });
    r.put('/settings', async (...p) => { await authN(u, 'updateSettings', p); });
    r.get('/setting/:setting', async (...p) => { await authN(u, 'getSetting', p); });
    r.get('/settings/list', async (...p) => { await authN(u, 'getAllSettings', p); });

    return r;
  }
}
