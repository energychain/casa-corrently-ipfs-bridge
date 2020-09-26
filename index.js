const IPFS = require("ipfs");
const BRIDGE = require("ipfs-http-client");
const topic = 'casa-corrently-beta';
const IPFS_CAT_TIMEOUT=60000;
const PURGE_AGE=4*3600000;

let msgcids = {};

const ipfsOptions = {
    EXPERIMENTAL: {
      pubsub: true
    }
};


const app = async function() {
  const ipfs = await IPFS.create();
  const bridge = BRIDGE('http://localhost:5001');

  try {
    ipfs.swarm.connect("/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star").catch(function(e) { console.log(e); });
    ipfs.swarm.connect("/ip4/108.61.210.201/tcp/4001/p2p/QmZW7WWzGB4EPKBE4B4V8zT1tY54xmTvPZsCK8PyTNWT7i").catch(function(e) { console.log(e); });
    ipfs.swarm.connect("/ip4/217.163.30.7/tcp/4001/p2p/Qmanvqjcisx3LP4z8gYaBP8Lyk15mSHdotNMEdXS8zP15B").catch(function(e) { console.log(e); });
    ipfs.swarm.connect("/ip4/62.75.168.184/tcp/4001/p2p/QmeW92PaNQHJzFM1fJ97JmojmWvGCkyzp1VFj4RURcGZkv").catch(function(e) { console.log(e); });
    ipfs.swarm.connect("/ip4/95.179.164.124/tcp/4001/p2p/QmesnMndaKtpmsTNVS1D54qdf7n6zjBCciT21ESMtaxBNh").catch(function(e) { console.log(e); });
    ipfs.swarm.connect("/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd").catch(function(e) {console.log(e);});
    ipfs.swarm.connect("/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3").catch(function(e) {console.log(e);});
    ipfs.swarm.connect("/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN").catch(function(e) {console.log(e);});

    const receiveMsg = async (msg) => {

      const parseSingle = async function(json) {
        const ipfsPath = '/ipfs/'+json.at;
        let content = '';
        for await (const chunk of ipfs.cat(ipfsPath,{timeout:IPFS_CAT_TIMEOUT})) {
            content += chunk;
        }
        let isnew=true;
        if(typeof msgcids[json.alias] !== 'undefined') {
          if(typeof json.on !== 'undefined') {
            if(json.on < msgcids[json.alias].on) {
              isnew=false;
            }
          }
        }

        if(isnew) {
          let _content = JSON.parse(content);
          if(_content.time > new Date().getTime() - PURGE_AGE) {
            msgcids[json.alias] = {
              "at":json.at,
              "on":new Date().getTime(),
              "content":content,
              "db":json.db
            }
            console.log("Received New",json.alias);
          }
        } else {
          console.log("Received Old",json.alias);
        }
      }

      let json = {};
      try {
        json = JSON.parse(msg.data.toString());
      } catch(e) {
        function uintToString(uintArray) {
            var encodedString = String.fromCharCode.apply(null, uintArray),
                decodedString = decodeURIComponent(escape(encodedString));
            return decodedString;
        }
        json = JSON.parse(uintToString(msg.data));
      }

      if(typeof json.broadcast !== 'undefined') {
        const ipfsPath = '/ipfs/'+json.broadcast;
        let content = '';
        for await (const chunk of ipfs.cat(ipfsPath,{timeout:IPFS_CAT_TIMEOUT})) {
            content += chunk;
        }
        bridge.files.write('/broadcasts/'+msg.from,content,{create:true,parents:true});

        let rcids = JSON.parse(content);
        for (const [key, value] of Object.entries(rcids)) {
            if(key.length > 10) {
              json.from = key;
              json.alias = key;
              json.at = value.at;
              json.db = value.db;
              await parseSingle(json);
            }
        }
        bridge.files.write('/p2p',JSON.stringify(msgcids),{create:true,parents:true});
        const stats = await bridge.files.stat("/",{hash:true});
        const lhash = await bridge.name.publish('/ipfs/'+stats.cid.toString());
        console.log("Broadcast published",lhash);
      }
    }
    await ipfs.pubsub.subscribe(topic, receiveMsg);
  } catch(e) {
    console.log(e);
  }
}

app();
