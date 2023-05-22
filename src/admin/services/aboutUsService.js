const mongoose=require('mongoose');
const aboutUsModel=require("../../models/aboutUsModel");
class aboutUsServices {
  constructor() {
    return {
      aboutusPage:this.aboutusPage.bind(this),
      editAboutUs:this.editAboutUs.bind(this),
    };
  }
  async aboutusPage(req){
    try{
      let checkData=await aboutUsModel.find();

      if(checkData.length > 0){
        return{
          status:true,
          data:checkData[0]
        }
      }else{
        return{
          status:false,
        }
      }

    }catch(error){
      console.log(error);
    }
  }
  async editAboutUs(req){
    try{
        if(req.params.id == undefined){
          const insertData=await aboutUsModel.create(req.body);
          if(insertData){
            return{
              status:true,
              message:'about-us successfully add',
              insertID:insertData._id
            }
          }else{
            return{
              status:false,
              message:'can not insert ..error'
            }
          }
        }else{
          const updateData=await aboutUsModel.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:req.body
          });
          if(updateData.modifiedCount > 0){
            return{
              status:true,
              message:'about-us successfully update'
            }
          }else{
            return{
              status:false,
              message:'can not update ..error'
            }
          }
        }

    }catch(error){
        console.log(error);
    }
  }
}
module.exports = new aboutUsServices();
