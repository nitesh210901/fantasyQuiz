const mongoose=require('mongoose');
const contactModal=require("../../models/contactModel");
class contactModalServices {
  constructor() {
    return {
      contactPage:this.contactPage.bind(this),
      editContact:this.editContact.bind(this),
    };
  }
  async contactPage(req){
    try{
      let checkData=await contactModal.find();

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
  async editContact(req){
    try{
        if(req.params.id == undefined){
          const insertData=await contactModal.create(req.body);
          if(insertData){
            return{
              status:true,
              message:'contact successfully add',
              insertID:insertData._id
            }
          }else{
            return{
              status:false,
              message:'can not insert ..error'
            }
          }
        }else{
          const updateData=await contactModal.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:req.body
          });
          if(updateData.modifiedCount > 0){
            return{
              status:true,
              message:'contact successfully update'
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
module.exports = new contactModalServices();
