module.exports = function(config) {
    return {
        broadcast: async function(msgcids) {
          let lhash = '';
          try {
            const BRIDGE = require("ipfs-http-client");
            const bridge = BRIDGE('http://localhost:5001');
            try {
              await bridge.files.rm('/p2p');
            } catch (e) {

            }
            await bridge.files.write('/p2p',JSON.stringify(msgcids),{create:true,parents:true});
            const stats = await bridge.files.stat("/",{hash:true});
            lhash = await bridge.name.publish('/ipfs/'+stats.cid.toString());
            console.log("Broadcast published",lhash);
          } catch(e) {
            console.log(e);
          }
          return lhash;
        }
    }
};
