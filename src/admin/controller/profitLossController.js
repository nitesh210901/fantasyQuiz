const moment=require("moment");
const excel = require("exceljs");
const profitLossModel=require("../../models/profitLoss");

class profitLossController{
    constructor(){
        return{
            viewAllProfitLoss:this.viewAllProfitLoss.bind(this),
            viewAllProfitLossDataTable:this.viewAllProfitLossDataTable.bind(this),
            downloadAllProfitLossDataExcel:this.downloadAllProfitLossDataExcel.bind(this),
        }
    }
    async viewAllProfitLoss(req,res,next){
        try{
            res.locals.message = req.flash();
            let obj={};
            if(req.query.matchName){obj.matchName=req.query.matchName}
            if(req.query.start_date){obj.start_date=req.query.start_date}
            if(req.query.end_date){obj.end_date=req.query.end_date}
            res.render('profitLoss/viewAllprofitLoss',{sessiondata: req.session.data,data:obj})

        }catch(error){
            console.log(error);
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async viewAllProfitLossDataTable(req,res,next){
        try{
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {start_date:-1},
                dir, join
            let conditions = {};
            if(req.query.matchName){conditions.matchName={$regex: new RegExp(req.query.matchName.toLowerCase(), "i")}}
            if (req.query.start_date) {
                if (!req.query.end_date) {
                    conditions.start_date = { $gte: moment(req.query.start_date).format('YYYY-MM-DD HH:mm:ss ') }
                }
            }
            if (req.query.end_date) {
                if (!req.query.start_date) {
                    conditions.start_date = { $lte: moment(req.query.end_date).format('YYYY-MM-DD HH:mm:ss') }
                }
            }
            // if (req.query.start_date && req.query.end_date) {
            //     conditions.start_date = { $gte: moment(req.query.start_date).format('YYYY-MM-DD HH:mm:ss') }
            //     conditions.start_date = { $lte: moment(req.query.end_date).format('YYYY-MM-DD HH:mm:ss') }
            // }
            
            profitLossModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                profitLossModel.find(conditions).sort(sortObject).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                    if(err){
                        console.log(err)
                    }
                    rows1.forEach(index => {
                        // let st_date;
                        // if(index.start_date){
                        //     st_date=`<span style="color='green'">${index.start_date}</span>`
                        // }
                        let start_date_format = moment(index.start_date, 'DD-MM-YYYY HH:mm:ss').format('dddd, DD-MMM-YYYY, h:mm:ss a');
                       
                        let start_date = `<div class="text-center"><span class="font-weight-bold text-success">${start_date_format.split(',')[0]},</span><br>
                        <span class="font-weight-bold text-primary">${start_date_format.split(',')[1]}</span><br>
                        <span class="font-weight-bold text-danger">${start_date_format.split(',')[2]}</span></div>`
                    
                        data.push({
                            'count': count,
                            'matchName': index.matchName,
                            'start_date': `<span class="text-success">${ moment(index.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a")}</span>`,
                            'invested_amount': index.invested_amount,
                            'win_amount': index.win_amount,
                            'refund_amount': index.refund_amount,
                            'youtuber_bonus': index.youtuber_bonus,
                            // 'TDS_amount': index.TDS_amount,
                            'profit_or_loss': index.profit_or_loss,
                            'profit_or_loss_amount': index.profit_or_loss_amount,
                            // 'action': `<a class="btn btn-secondary">contest report</a>`
                        });  
                        
                        count++;
                        if (count > rows1.length) {
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            // console.log("json_data..///>>.......",json_data);
                            res.send(json_data);
                        }
                    })
                })
            })

        }catch(error){
            console.log(error);
        }
    }
    async downloadAllProfitLossDataExcel(req,res,next){
        try{
            let data = [];
            let count = 1;
            let conditions = {};
            if(req.query.matchName){conditions.matchName={$regex: new RegExp(req.query.matchName.toLowerCase(), "i")}}
            if (req.query.start_date) {
                if (!req.query.end_date) {
                    conditions.start_date = { $gte: moment(req.query.start_date).format('YYYY-MM-DD HH:mm:ss ') }
                }
            }
            if (req.query.end_date) {
                if (!req.query.start_date) {
                    conditions.start_date = { $lte: moment(req.query.end_date).format('YYYY-MM-DD HH:mm:ss') }
                }
            }
            profitLossModel.find(conditions).sort({start_date:-1}).exec((err, rows1) => {
                if(err){
                    console.log(err)
                }
                rows1.forEach(index => {
                    data.push({
                        'count': count,
                        'matchName': index.matchName,
                        'start_date': `${ moment(index.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a")}`,
                        'invested_amount': index.invested_amount,
                        'win_amount': index.win_amount,
                        // 'refund_amount': index.refund_amount,
                        'youtuber_bonus': index.youtuber_bonus,
                        // 'TDS_amount': index.TDS_amount,
                        'profit_or_loss': index.profit_or_loss,
                        'profit_or_loss_amount': index.profit_or_loss_amount,
                    });  
                    
                    count++;

                })
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("profitLossData");
                worksheet.columns = [
                  { header: "S.no", key: "count", width: 10 },
                  { header: "Match Name", key: "matchName", width: 45 },
                  { header: "Start Date", key: "start_date", width: 35 },
                  { header: "Invested Amount", key: "invested_amount", width: 18 },
                  { header: "Win Amount", key: "win_amount", width: 18 },
                //   { header: "Refund Amount", key: "refund_amount", width: 15 },
                  { header: "Youtuber Bonus", key: "youtuber_bonus", width: 12 },
                //   { header: "TDS Amount", key: "TDS_amount", width: 18 },
                  { header: "Profit or Loss", key: "profit_or_loss", width: 18 },
                  { header: "Profit or Loss Amount", key: "profit_or_loss_amount", width: 22 },
                ];
                // Add Array Rows
                worksheet.addRows(data);
                res.setHeader(
                  "Content-Type",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                  "Content-Disposition",
                  "attachment; filename=" + "profitLossDataTable.xlsx"
                );
                return workbook.xlsx.write(res).then(function () {
                  res.status(200).end();
                });
            })


        }catch(error){
            console.log(error);
        }
    }

}

module.exports = new profitLossController();