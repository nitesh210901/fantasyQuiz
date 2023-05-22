const mongoose=require('mongoose');
const privacyPolicyModal=require("../../models/privacyPolicyModal");
class privacyPolicyServices {
  constructor() {
    return {
      privacyPolicyPage:this.privacyPolicyPage.bind(this),
      editPrivacyPolicy:this.editPrivacyPolicy.bind(this),
    };
  }
  async privacyPolicyPage(req){
    try{
      let checkData=await privacyPolicyModal.find();

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
  async editPrivacyPolicy(req){
    try{
        if(req.params.id == undefined){
          const insertData=await privacyPolicyModal.create(req.body);
          if(insertData){
            return{
              status:true,
              message:'privacy policy successfully add',
              insertID:insertData._id
            }
          }else{
            return{
              status:false,
              message:'can not insert ..error'
            }
          }
        }else{
          const updateData=await privacyPolicyModal.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:req.body
          });
          if(updateData.modifiedCount > 0){
            return{
              status:true,
              message:'privacy policy successfully update'
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
module.exports = new privacyPolicyServices();
