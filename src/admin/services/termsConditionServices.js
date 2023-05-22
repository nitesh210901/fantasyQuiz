const mongoose=require('mongoose');
const termsConditionModal=require("../../models/termsConditionsModel");
class TermsConditionsServices {
  constructor() {
    return {
      termsConditionPage:this.termsConditionPage.bind(this),
      editTermsCondition:this.editTermsCondition.bind(this),
    };
  }
  async termsConditionPage(req){
    try{
      let checkData=await termsConditionModal.find();

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
  async editTermsCondition(req){
    try{
        if(req.params.id == undefined){
          const insertData=await termsConditionModal.create(req.body);
          if(insertData){
            return{
              status:true,
              message:'terms conditions successfully add',
              insertID:insertData._id
            }
          }else{
            return{
              status:false,
              message:'can not insert ..error'
            }
          }
        }else{
          const updateData=await termsConditionModal.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:req.body
          });
          if(updateData.modifiedCount > 0){
            return{
              status:true,
              message:'terms conditions successfully update'
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
module.exports = new TermsConditionsServices();
