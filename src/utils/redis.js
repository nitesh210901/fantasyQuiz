// let redis=require("redis");
// let redisClient=redis.createClient();
// redisClient.connect().catch(console.error)
// .then(() => {
//     console.log('Connected to Redis server successfully');
// });
// redisClient.on('error', err => console.log('Redis Client Error', err));


// async function getkeydata(key)
// {let result;
//     let data=await redisClient.get(key);
//     if(data)
//      result=JSON.parse(data);
//     else
//      result=null;
//      return result;
// }
//  function setkeydata(key,data,timing)
// {  
//    let result;
//    redisClient.set(key,JSON.stringify(data),{EX:timing});
//    return data;
    
// }
// function deletedata(key)
// {  
//     redisClient.del(key);
// }

// module.exports ={getkeydata,setkeydata,deletedata}

// await client.set('key', 'value');
// const value = await client.get('key');
// await client.disconnect();