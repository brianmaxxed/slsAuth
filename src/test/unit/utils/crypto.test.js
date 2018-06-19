/* eslint no-shadow: 0, no-unused-expressions:0 */
import crypto from '../../../../src/utils/crypto';
import c from '../../../../src/config/consts';

// what do i need to test.
// signup, login, logout, account, myAccount,

describe('crypto library', async () => {
  test('genRandomString', async () => {
    const size = 4;
    const str = await crypto.genRandomString(size);
    expect(str).toHaveLength(size);
  });

  test('generateSalt', async () => {
    const salt = await crypto.generateSalt(10);
    expect(typeof salt).toBe(c.STRING);
  });

  test('generateBcryptSalt', async () => {
    const salt = await crypto.generateBcryptSalt(10);
    expect(typeof salt).toBe(c.STRING);
  });

  test('hashPassword and comparePassword correctly', async () => {
    const newPassword = 'secPass!1';
    const { hash } = await crypto.hashPassword(newPassword);
    const oldPassword = hash;
    const p = await crypto.comparePassword(newPassword, oldPassword);
    expect(p).toBe(true);
  });
});
