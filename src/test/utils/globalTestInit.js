// occurs for BEFORE EACH test.
if (jest) jest.setTimeout(15000);

/*
import D from '../data/Data';

const kickoff = async () => {
  try {
    const sleep = async () => (fn, s, par) => new Promise((resolve) => {
      // wait 3s before calling fn(par)
      setTimeout(() => resolve(fn(par)), s * 1000);
    });

    const accountId = await D.accountInit();
    console.log('accountId:', accountId);

    console.log('READY TO TEST...');
};

kickoff();
*/
