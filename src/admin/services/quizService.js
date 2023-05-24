const mongoose = require('mongoose');
const moment = require("moment");

const quizModel = require('../../models/quizModel');

class quizServices {
    constructor() {
        return {
            AddQuiz: this.AddQuiz.bind(this),
            seriesDataTable: this.seriesDataTable.bind(this),
            updateStatusforSeries: this.updateStatusforSeries.bind(this),
            edit_Series: this.edit_Series.bind(this),
            editSeriesData: this.editSeriesData.bind(this),
            findSeries: this.findSeries.bind(this),
            editQuizData: this.editQuizData.bind(this),
            editQuiz: this.editQuiz.bind(this),
            deletequiz: this.deletequiz.bind(this)
        }
    }

    async findSeries(data) {
        let result = await seriesModel.find(data);
        return result;
    }

    async AddQuiz(req) {
        try {
            let addquiz = new quizModel({
                question: req.body.question,
                option_A: req.body.option_A,
                option_B: req.body.option_B,
                option_C: req.body.option_C,
                option_D: req.body.option_D,
                answer: req.body.answer,
                matchkey_id: req.body.matchkey_id,
                point:req.body.point
            });

            let savequiz = await addquiz.save();
            if (savequiz) {
                return {
                    status:true,
                    message:'quiz add successfully'
                }
            }else{
                return {
                    status:false,
                    message:'quiz not add error..'
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async seriesDataTable(req) {
        try {
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {},
                dir, join
                //  console.log("sortObject..",sortObject);
                // let name;
                // if (req.query.name && req.query.name !== "")
                // {
                //     name = req.query.name;
                //     console.log("name..",name)
                // }
            let conditions = {};
            if (req.query.seriesName) {
                let seriesName = req.query.seriesName;
                conditions.seriesName ={ $regex: new RegExp("^" + seriesName.toLowerCase(), "i") }
            }
            // console.log("conditions.....", conditions)

            seriesModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                seriesModel.find(conditions).skip(Number(start)).limit(Number(limit1)).sort(sortObject).exec((err, rows1) => {
                   
                    if (err) console.log(err);
                    rows1.forEach((index) => {
                     
                        data.push({
                            "fantasy_type": index.fantasy_type,
                            "name": index.name,
                            "start_date": moment(index.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "end_date": moment(index.end_date).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "status": index.status,
                            "Actions": `<div class="row">
                        <div class="col-md-6">
                        <a href="#" ><i class="bi bi-pencil-square" style="color:blue;" title="update"></i></a>
                        </div>
                        <div class="col-md-6">
                        <a href="#"><i class="bi bi-trash2-fill" style="color:blue;" title="delete"></i></a>
                        </div>
                        </div>`
                        });
                        count++;

                        if (count > rows1.length) {
                           
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            return json_data;
                        }
                    });
                });
            });
        } catch (error) {
            throw error;
        }
    }

    async updateStatusforSeries(req) {
        try {
            // console.log('id',req.params.id);
            // console.log('id',req.query.status);
            let data = await seriesModel.updateOne({ _id: req.params.id }, { $set: { status: req.query.status } });
            
            if (data.modifiedCount == 1) {
                return true;
            }
        } catch (error) {
            throw error;
        }
    }

    async edit_Series(req) {
        try {
            if(req.params.id){

                let whereObj = {
                    is_deleted: false,
                    _id: req.params.id
                };
                let data = await this.findSeries(whereObj);
                
                if (data.length > 0) {
                    return {
                        status:true,
                        data:data
                    }
                }else{
                    return {
                        status:false,
                        message:'series not found ..'
                    }
                }

            }else{
                return{
                    status:false,
                    message:'Invalid series Id..'
                }
            }
            
        } catch (error) {
            throw error;
        }
    }

    async editSeriesData(req) {
        try {
            if(req.body.seriesName){
                let doc = req.body
                doc.name = doc.seriesName;
                delete doc.seriesName;
    
                let whereObj = {
                    is_deleted: false,
                    _id: { $ne: req.params.id },
                    name: doc.name,
    
                }
                const data = await this.findSeries(whereObj);
                // console.log(`data-------services-------`, data);
                if (data.length > 0) {
                    return {
                        message: "series Name already exist...",
                        status: false,
                        data: data[0]
                    };
                } else {
                    let whereObj = {
                        is_deleted: false,
                        _id: req.params.id
    
                    }
                    const data = await this.findSeries(whereObj);
                    // console.log(`(moment(doc.startdate).format('DD-MM-YYYY')).isBefore(moment(doc.enddate).format('DD-MM-YYYY'))`, moment(moment(doc.startdate).format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.enddate).format('DD-MM-YYYY'), 'DD-MM-YYYY')))
                    if (moment(moment(doc.start_date).format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.end_date).format('DD-MM-YYYY'), 'DD-MM-YYYY')) === false) {
                     
                        return {
                            message: "start date should be less then end date...",
                            status: false,
                            data: data[0]
                        };
                    } else if (moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.end_date).format('DD-MM-YYYY'), 'DD-MM-YYYY')) === false) {
                        return {
                            message: "end date should be greater then current date...",
                            status: false,
                            data: data[0]
                        };
                    } else {
                        let data = await seriesModel.updateOne({ _id: req.params.id }, { $set: doc });
    
                        if (data.modifiedCount == 1) {
                            return {
                                status:true,
                                message:'series update successfully'
                            }
                        }
                    }
                }
            }else{
                return{
                    status:false,
                    message:'series name required..'
                }
            }
            
        } catch (error) {
            throw error;
        }
    }

    async editQuiz(req){
        let whereObj ={
            _id:req.params.id
        }
        let data = await quizModel.find(whereObj);
        if(data.length > 0){
            return data[0];
        }
    }

    async editQuizData(req){ 
        let whereObj ={
            _id:req.params.id
        }
        let doc=req.body;
        delete doc.typename;
        const data=await quizModel.updateOne(whereObj,{$set:doc});
        if(data.modifiedCount == 1){
            return {
                status:true,
                message:"Quiz Update successfully"
            } 
      }
    }

    async deletequiz(req){
        try {
            const deletequiz = await quizModel.deleteOne({ _id: req.query.quizId });
            if(deletequiz.deletedCount > 0 ){
                return {
                    status:true,
                    message:'quiz deleted successfully'
                };
            }else{
                return {
                    status:false,
                    message:'quiz can not delete --error'
                }
            }

        }catch(error){
            throw error;
        }
    }
}
module.exports = new quizServices();