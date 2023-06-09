const mongoose = require("mongoose");
// const stocksOfCategoryModel = require("../../models/stocksOfCategoryModel");
const stockCategoryModel = require("../../models/stockcategoryModel");
const stockModel = require("../../models/stockModel");

class stockCategory {
    constructor() {
        return {
            viewStockDatabale: this.viewStockDatabale.bind(this),
            viewStock: this.viewStock.bind(this),
            saveStockCategory: this.saveStockCategory.bind(this),
        }
    }

    async viewStock(req, res) {
        try {
            res.locals.message = req.flash();
            let name = req.query.name;
            const categories = await stockCategoryModel.find({}, {name:1});
            res.render("stockManager/viewStock", { sessiondata: req.session.data, name , categories});

        } catch (error) {
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/");
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
                            's_no': `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                            <label class="custom-control-label" for="check${index._id}"></label></div>`,
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
    
    async saveStockCategory(req, res) {
        try {
           const saveCategory = await stockCategoryModel.findOneAndUpdate({_id:req.body.category_id}, {stocks_id:req.body.stocks_id});
           res.send({data:saveCategory});
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

}
module.exports = new stockCategory();