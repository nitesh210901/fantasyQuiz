const res = require('express/lib/response');
const mongoose = require('mongoose');
const randomstring = require("randomstring");

// const contestCategoryModel = require("../../models/contestcategoryModel");
const stockCategoryModel = require("../../models/stockcategoryModel");

class stockCategory {
    constructor() {
        return {
            addStockCategoryData: this.addStockCategoryData.bind(this),
            editStockCategory: this.editStockCategory.bind(this),
            deleteStockCategory: this.deleteStockCategory.bind(this),
            editStockCategoryData:this.editStockCategoryData.bind(this),
        }
    }
    // --------------------
    async addStockCategoryData(req) {
        try {
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }

            }
            let insertObj = {
                name: req.body.name,
                categoryType:req.body?.categoryType,
                sub_title: req.body.sub_title,
                Order:req.body.Order,
            }
            if (req.file) {
                insertObj.image = `/${req.body.typename}/${req.file.filename}`
            }
            const addStockCategory = new stockCategoryModel(insertObj);
            let saveContest = await addStockCategory.save();
            if (saveContest) {
                return true;
            }

        } catch (error) {
            throw error;
        }
    }

    async editStockCategoryData(req) {
        try {
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }

            }
            const checkstockCat=await stockCategoryModel.findOne({_id:req.params.stockId});
            if(checkstockCat){
                const checkName=await stockCategoryModel.findOne({_id:{$ne:req.params.stockId},name:req.body.name});
                if(checkName){
                    return{
                        status:false,
                        message:'stock category name already exites'
                    }
                    
                }else{
                    console.log("....stock category.......", req.body, req.file)
                    let insertObj = {
                        name: req.body.name,
                        categoryType: req.body.categoryType,
                    }
                    if (req.file) {
                        insertObj.image = `/${req.body.typename}/${req.file.filename}`
                    }
                    if(req.file){
                        if(checkstockCat.image){
                            let fs = require('fs');
                            let filePath = `public${checkstockCat.image}`;
                            if(fs.existsSync(filePath) == true){
                                fs.unlinkSync(filePath);
                            }
                        }
                    }
                    const addStockCategory = await stockCategoryModel.updateOne({_id:req.params.stockId},{
                        $set:insertObj
                    })
                    if(addStockCategory.modifiedCount == 1){
                        return{
                            status:true,
                            message:'stock category successfully update'
                        }
                    }else{
                        return{
                            status:false,
                            message:'stock category not update..error..'
                        }
                    }
                    
                }
            }else{
                return{
                    status:false,
                    message:'Invalid Stock Id..'
                }
            }
            

        } catch (error) {
            throw error;
        }
    }
    async editStockCategory(req) {
        try {
            const getEditData = await stockCategoryModel.findOne({ _id: req.query.stockCatId })
            if (getEditData) {
                return getEditData;
            }

        } catch (error) {
            throw error;
        }
    }
    async deleteStockCategory(req) {
        try {
            const getImg = await stockCategoryModel.findOne({ _id: req.query.stockCatId });
            if (getImg.image) {
                let fs = require('fs');
                let filePath = `public/${getImg.image}`;
                if(fs.existsSync(filePath) == true){
                    fs.unlinkSync(filePath);
                }
            }
            const deleteBanner = await stockCategoryModel.deleteOne({ _id: req.query.stockCatId });
            if (deleteBanner) {
                return true;
            }

        } catch (error) {
            throw error;
        }
    }
    
}
module.exports = new stockCategory();