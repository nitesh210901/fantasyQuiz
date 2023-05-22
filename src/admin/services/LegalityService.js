const mongoose=require('mongoose');
const LegalityModel=require("../../models/LegalityModel");
class LegalityServices {
  constructor() {
    return {
      LegalityPage:this.LegalityPage.bind(this),
      editLegality:this.editLegality.bind(this),
    };
  }
  async LegalityPage(req){
    try{
      let checkData=await LegalityModel.find();

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
  async editLegality(req){
    try{
        if(req.params.id == undefined){
          const insertData=await LegalityModel.create(req.body);
          if(insertData){
            return{
              status:true,
              message:'legality Policy successfully add',
              insertID:insertData._id
            }
          }else{
            return{
              status:false,
              message:'can not insert ..error'
            }
          }
        }else{
          const updateData=await LegalityModel.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:req.body
          });
          if(updateData.modifiedCount > 0){
            return{
              status:true,
              message:'legality Policy successfully update'
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
module.exports = new LegalityServices();
