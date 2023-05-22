const mongoose=require('mongoose');
const FAQQuestionModel=require("../../models/FAQQuestionModel")
class FAQServices {
  constructor() {
    return {
        FAQQuestionData:this.FAQQuestionData.bind(this),
        editFAQQuestion:this.editFAQQuestion.bind(this),
        editFAQQuestionData:this.editFAQQuestionData.bind(this),
        deleteFAQQuestion:this.deleteFAQQuestion.bind(this),
    };
  }
  async FAQQuestionData(req){
    try{
            let obj=req.body;
            const checkQuestion=await FAQQuestionModel.findOne({question:req.body.question});
            if(checkQuestion){
                return{
                    status:false,
                    message:'question already exist ..'
                }
            }else{
                const insertData=await FAQQuestionModel.create(obj);
                if(insertData){
                    return{
                        status:true,
                        message:'Question add successfully'
                    }
                }else{
                    return{
                        status:false,
                        message:'Question not add.. error'
                    }
                }
            }

    }catch(error){
        console.log(error);
    }
  }
  async editFAQQuestion(req){
    try{
        const editData=await FAQQuestionModel.findOne({_id:mongoose.Types.ObjectId(req.params.id)});
        if(editData){
            return{
                status:true,
                data:editData
            }
        }else{
            return{
                status:false,
                message:'something is know to find data for edit'
            }
        }

    }catch(error){
        console.log(error)
    }
  }
  async editFAQQuestionData(req){
    try{
        
            let obj=req.body;
            const checkQuestion=await FAQQuestionModel.findOne({question:req.body.question,_id:{$ne:mongoose.Types.ObjectId(req.params.id)}});
            if(checkQuestion){
                    return{
                        status:false,
                        message:'question already exicts ...error'
                    }
            }
            let updateData=await FAQQuestionModel.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
                $set:obj
            });
            if(updateData.modifiedCount > 0){
                return{
                    status:true,
                    message:'question successfully update..'
                }
            }else{
                return{
                    status:false,
                    message:'question not update ...error'
                }
            }

    }catch(error){
        console.log(error)
    }
  }
  async deleteFAQQuestion(req){
    try{
        const data=await FAQQuestionModel.deleteOne({_id:mongoose.Types.ObjectId(req.params.id)});
        if(data.deletedCount > 0){
            return{
                status:true,
                message:`Question deleted successfully`
            }
        }else{
            return{
                status:false,
                message:'can not delete ..error'
            }
        }

    }catch(error){
        console.log(error);
    }
  }
}
module.exports = new FAQServices();
