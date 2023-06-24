const contestCategoryService = require('../services/contestCategoryService');
const stockCategoryService = require('../services/stockCategoryService');
const mongoose = require("mongoose");
const contestCategoryModel = require("../../models/contestcategoryModel");
const stockCategoryModel = require("../../models/stockcategoryModel");
const stockModel = require("../../models/stockModel");
const stockContestCategory = require('../../models/stockContestCategory');

class stockCategory {
    constructor() {
        return {
            stockCategoryPage: this.stockCategoryPage.bind(this),
            createStockCategory: this.createStockCategory.bind(this),
            addStockCategoryData: this.addStockCategoryData.bind(this),
            stockCategoryTable: this.stockCategoryTable.bind(this),
            editStockCategory: this.editStockCategory.bind(this),
            deleteStockCategory: this.deleteStockCategory.bind(this),
            editStockCategoryData: this.editStockCategoryData.bind(this),
            viewStockDatabale: this.viewStockDatabale.bind(this),
        }
    }

    async viewStockDatabale(req, res, next) {
        try {
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {},
                dir, join
            let conditions = {};
            if (req.query.searchName) {
                let searchName = req.query.searchName;
                conditions.name = { $regex: new RegExp("^" + searchName.toLowerCase(), "i") }
            }
            stockModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                stockModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').sort({ Order: -1 }).exec(async (err, rows1) => {
                    console.log('-----------------------',rows)
                    if (err) console.log(err);
                    for (let index of rows1) {

                        let image, leaderBoard, L_status, l_board;
                        if (index.image) {
                            image = `<img src="${index.image}" class="w-40px view_team_table_images h-40px rounded-pill">`
                        } else {
                            image = `<img src="/uploadImage/defaultImage.jpg" class="w-40px view_team_table_images h-40px rounded-pill">`
                        }
                       
                        data.push({
                            'count': count,
                            'instrument_token': index.instrument_token,
                            'exchange_token': index.exchange_token,
                            'tradingsymbol': index.tradingsymbol,
                            'name': index.name,
                            "expiry": index.expiry,
                            "strike": index.strike,
                            "tick_size": index.tick_size,
                            "lot_size": index.lot_size,
                            "instrument_type": index.instrument_type,
                            "segment": index.segment,
                            "exchange": index.exchange,
                        });
                        count++;

                        if (count > rows1.length) {
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            res.send(json_data);

                        }
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }

    async stockCategoryTable(req, res, next) {
        try {
            let limit1 = req.query.length;
            let start = req.query.start;

            let conditions = {};
            if (req.query.searchName) {
                let searchName = req.query.searchName;
                conditions.name = { $regex: new RegExp("^" + searchName.toLowerCase(), "i") }
            }
            if(req.query.categoryType != 'null'){
                conditions.categoryType = req.query.categoryType;
            }
            stockCategoryModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                stockCategoryModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').sort({ Order: -1 }).exec(async (err, rows1) => {

                    if (err) console.log(err);
                    for (let index of rows1) {
                        let image, leaderBoard, L_status, l_board;
                        if (index.image) {
                            image = `<img src="${index.image}" class="w-40px view_team_table_images h-40px rounded-pill">`
                        } else {
                            image = `<img src="/uploadImage/defaultImage.jpg" class="w-40px view_team_table_images h-40px rounded-pill">`
                        }
                        
                        data.push({
                            'count': count,
                            'name': index.name,
                            "categoryType":index.categoryType,
                            'image': image,
                            'action': ` 
                            <a class="btn w-35px h-35px mr-1 btn-orange text-uppercase btn-sm"
                            data-toggle="tooltip" title="Edit"
                            href="/edit-stock-category?stockCatId=${index._id}"><i class="fas fa-pencil"></i>
                        </a>
                        <a class="btn w-35px h-35px mr-1 btn-danger text-uppercase btn-sm"
                            data-toggle="tooltip" title="Delete"
                            onclick="delete_sweet_alert('/delete-stock-category?stockCatId=${index._id}', 'Are you sure you want to delete this data?')">
                            <i class="far fa-trash-alt"></i>
                        </a>`
                        });
                        count++;

                        if (count > rows1.length) {
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            res.send(json_data);

                        }
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }
    
    async stockCategoryPage(req, res, next) {
        try {
            res.locals.message = req.flash();
            let name = req.query.name;
            let category  = await stockContestCategory.find({name:{$ne:"CRICKET"}});
            let catName = req.query.category;
            res.render("stockManager/viewStockCategory", { sessiondata: req.session.data, name, category, catName  });

        } catch (error) {
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/");
        }
    }
    
    async createStockCategory(req, res, next) {
        try {
            res.locals.message = req.flash();
            res.render("stockManager/createStockCategory", { sessiondata: req.session.data, });

        } catch (error) {
            //  next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/viewStockCategory");
        }
    }

    async addStockCategoryData(req, res, next) {
        try {
            res.locals.message = req.flash();
            const postData = await stockCategoryService.addStockCategoryData(req);
            if (postData) {
                res.redirect("/viewStockCategory");
            }
        } catch (error) {
            //  next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/viewStockCategory");
        }
    }

    async editStockCategoryData(req, res, next) {
        try {
            res.locals.message = req.flash();
            const updateData = await stockCategoryService.editStockCategoryData(req);
            if (updateData.status == true) {
                req.flash('success', updateData.message);
                res.redirect('/viewStockCategory')
            } else if (updateData.status == false) {
                req.flash('error', updateData.message);
                res.redirect(`/edit-stock-category?stockCatId=${req.params.stockId}`)
            }

        } catch (error) {
            //  next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/viewStockCategory");
        }
    }

    // async stockCategoryTable(req, res, next) {
    //     try {
    //         let limit1 = req.query.length;
    //         let start = req.query.start;
    //         let sortObject = {},
    //             dir, join
    //         let conditions = {};
    //         if (req.query.searchName) {
    //             let searchName = req.query.searchName;
    //             conditions.name = { $regex: new RegExp("^" + searchName.toLowerCase(), "i") }
    //         }
    //         stockCategoryModel.countDocuments(conditions).exec((err, rows) => {
    //             let totalFiltered = rows;
    //             let data = [];
    //             let count = 1;
    //             stockCategoryModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').sort({ Order: -1 }).exec(async (err, rows1) => {

    //                 if (err) console.log(err);
    //                 for (let index of rows1) {

    //                     let image, leaderBoard, L_status, l_board;
    //                     if (index.image) {
    //                         image = `<img src="${index.image}" class="w-40px view_team_table_images h-40px rounded-pill">`
    //                     } else {
    //                         image = `<img src="/uploadImage/defaultImage.jpg" class="w-40px view_team_table_images h-40px rounded-pill">`
    //                     }
    //                     // if (index.has_leaderBoard == "yes") {
    //                     //     L_status = `<span style="color:green;" >${index.has_leaderBoard.toUpperCase()}</span>`
    //                     //     leaderBoard = `<span style="color:red;" >I</span>`
    //                     //     l_board = 'no'
    //                     // } else {
    //                     //     leaderBoard = `<span style="color:red;" >A </span>`
    //                     //     L_status = `<span style="color:red;" >${index.has_leaderBoard.toUpperCase()}</span>`
    //                     //     l_board = 'yes'
    //                     // }
    //                     data.push({
    //                         'count': count,
    //                         'name': index.name,
    //                         'sub_title': index.sub_title,
    //                         'image': image,
    //                         // 'leaderboard': L_status,
    //                         "Order": index.Order,
    //                         'action': ` 
    //                         <a class="btn w-35px h-35px mr-1 btn-orange text-uppercase btn-sm"
    //                         data-toggle="tooltip" title="Edit"
    //                         href="/edit-stock-category?stockCatId=${index._id}"><i class="fas fa-pencil"></i>
    //                     </a>
    //                     <a class="btn w-35px h-35px mr-1 btn-danger text-uppercase btn-sm"
    //                         data-toggle="tooltip" title="Delete"
    //                         onclick="delete_sweet_alert('/delete-stock-category?stockCatId=${index._id}', 'Are you sure you want to delete this data?')">
    //                         <i class="far fa-trash-alt"></i>
    //                     </a>`
    //                     });
    //                     count++;

    //                     if (count > rows1.length) {
    //                         let json_data = JSON.stringify({
    //                             "recordsTotal": rows,
    //                             "recordsFiltered": totalFiltered,
    //                             "data": data
    //                         });
    //                         res.send(json_data);

    //                     }
    //                 }
    //             });
    //         });



    //     } catch (error) {
    //         throw error;
    //     }
    // }

    async editStockCategory(req, res, next) {
        try {
            res.locals.message = req.flash();
            const editStockCat = await stockCategoryService.editStockCategory(req);
            if (editStockCat) {
                res.render("stockManager/editStockCategory", { sessiondata: req.session.data, data: editStockCat })
            }
        } catch (error) {
            //  next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/viewStockCategory");
        }
    }
    async deleteStockCategory(req, res, next) {
        try {
            res.locals.message = req.flash();
            const deleteStocktCat = await stockCategoryService.deleteStockCategory(req);
            if (deleteStocktCat) {
                res.redirect('/viewStockCategory')
            }
        } catch (error) {
            //  next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/viewStockCategory");
        }
    }
}
module.exports = new stockCategory();