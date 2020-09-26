module.exports = function(config) {
    return {
        broadcast: async function(msgcids) {
          const BRIDGE = require("ipfs-http-client");
          const bridge = BRIDGE('http://localhost:5001');
          await bridge.files.write('/p2p',JSON.stringify(msgcids),{create:true,parents:true});
          const stats = await bridge.files.stat("/",{hash:true});
          const lhash = await bridge.name.publish('/ipfs/'+stats.cid.toString());
          console.log("Broadcast published",lhash);
          return lhash;
        }
    }
};
