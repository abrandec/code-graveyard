import { program } from 'commander';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import fs from 'fs';

program
  .option('-d, --debug', 'output extra debugging')
  .option('-a, --address <type>')
  .option('-mh, --messageHash <type>');
program.parse(process.argv);

const options = program.opts();
if (options.debug) {
  console.log(options);
}

const userInfo = JSON.parse(fs.readFileSync('./typescript/acct_mgmt.json', 'utf8'));

const username = options.address;
const messageHash = options.messageHash;

const getNonce = options.getNonce;
const getUsername = options.getUsername;

// Hashmap stored in 1st index
// Address gets user's index
const userIndex: number = userInfo[0][username];

// if user doesn't exist
if (userIndex == null) {
  console.log('USER UNKNOWN');
  // if user exists and messageHash wasn't provided, return message for user to sign
} else if (!messageHash) {
  console.log(JSON.stringify(userInfo[userIndex]));
} else {
  const message = JSON.stringify(userInfo[userIndex]);

  const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
  // address recovery voodoo
  const recoveredAddr = recoverPersonalSignature({
    data: msg,
    signature: messageHash
  });
  // check if recovered address == address provided
  if (username.toLowerCase() !== recoveredAddr) {
    // Authentication failure
    console.log('AUTHENTICATION FAILURE');
    // Authentication success
  } else {
    // update user nonce
    ++userInfo[userIndex].nonce;
    fs.writeFile(
      './typescript/acct_mgmt.json',
      JSON.stringify(userInfo, null, 2),
      'utf8',
      function (err) {
        if (err) {
          console.log(err);
        } else {
          // if nothing funky happened, return success
          console.log('AUTHENTICATION SUCCESS');
        }
      }
    );
  }
}
