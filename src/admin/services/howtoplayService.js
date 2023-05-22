const mongoose=require('mongoose');
const howtoplayModel=require("../../models/howtoplayModel");
class howtoplayServices {
  constructor() {
    return {
      howtoplayPage:this.howtoplayPage.bind(this),
      editHowtoplay:this.editHowtoplay.bind(this),
      viewSelectedCategoryHowtoplay:this.viewSelectedCategoryHowtoplay.bind(this),
    };
  }
  async howtoplayPage(req){
    try{
      let checkData=await howtoplayModel.find();
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
  async editHowtoplay(req){
    try{
        if(!req.body.id){
          const insertData=await howtoplayModel.create(req.body);
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
          const updateData=await howtoplayModel.updateOne({_id:mongoose.Types.ObjectId(req.body.id)},{
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
  async viewSelectedCategoryHowtoplay(req){
    try{
        const getData=await howtoplayModel.find({category:req.query.category});
        // console.log("servers data....",getData)
        return getData;

    }catch(error){
        console.log(error)
    }
  }
}
module.exports = new howtoplayServices();
