'use strict';

const await   = require('asyncawait/await');
const async   = require('asyncawait/async');
const ipfsd   = require('ipfsd-ctl');
const OrbitDB = require('../src/OrbitDB');
const Timer   = require('./Timer');

// usage: benchmark.js <host> <username> <channel>;

// orbit-server
const host = process.argv[2] ? process.argv[2] : 'localhost'
const port = 3333;

const username = process.argv[3] ? process.argv[3] : 'testrunner';
const password = '';

const channelName = process.argv[4] ? process.argv[4] : 'c1';

const startIpfs = () => {
  return new Promise((resolve, reject) => {
    ipfsd.disposableApi((err, ipfs) => {
      if(err) console.error(err);
      resolve(ipfs);
    });
  });
};

let run = (async(() => {
  try {
    // Connect
    const ipfs = await(startIpfs());
    const orbit = await(OrbitDB.connect(host, port, username, password, ipfs));
    const db = await(orbit.eventlog(channelName));

    // Metrics
    let totalQueries = 0;
    let seconds = 0;
    let queriesPerSecond = 0;
    let lastTenSeconds = 0;

    // Metrics output
    setInterval(() => {
      seconds ++;

      if(seconds % 10 === 0) {
        console.log(`--> Average of ${lastTenSeconds/10} q/s in the last 10 seconds`)

        if(lastTenSeconds === 0)
          throw new Error("Problems!");

        lastTenSeconds = 0
      }

      console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds`)

      queriesPerSecond = 0;
    }, 1000);

    const query = async(() => {
      // let timer = new Timer();
      // timer.start();
      try {
        await(db.add(username + totalQueries));
        // console.log(`${timer.stop(true)} ms`);
        totalQueries ++;
        lastTenSeconds ++;
        queriesPerSecond ++;
      } catch(e) {
        console.log(e);
      }
      process.nextTick(query);
    });

    query();

  } catch(e) {
    console.error("error:", e);
    console.error(e.stack);
    process.exit(1);
  }
}))();

module.exports = run;
