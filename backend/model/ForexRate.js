const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var forexRateSchema = new Schema({
    admin: {
        type: String,
        default: "admin"
    },
    USD:{
        CADperUSD: {
            type: Number,
            default: 1.3464
        },
        GBPperUSD: {
            type: Number,
            default: 0.8047
        },
        JPYperUSD: {
            type: Number,
            default: 133.6777
        },
        EURperUSD: {
            type: Number,
            default: 0.9163
        },
        CNYperUSD: {
            type: Number,
            default: 6.8866
        },
        INRperUSD: {
            type: Number,
            default: 82.0684
        },
        AUDperUSD: {
            type: Number,
            default: 1.5131
        },
        NZDperUSD: {
            type: Number,
            default: 1.6148
        },
        ETHperUSD: {
            type: Number,
            default: 0.00054
        },
        ADAperUSD: {
            type: Number,
            default: 2.7541
        },
        DOGEperUSD: {
            type: Number,
            default: 13.7353
        },
    },
    CAD:{
        USDperCAD: {
            type: Number,
            default: 0.7426
        },
        GBPperCAD: {
            type: Number,
            default: 0.5976
        },
        JPYperCAD: {
            type: Number,
            default: 99.2640
        },
        EURperCAD: {
            type: Number,
            default: 0.6805
        },
        CNYperCAD: {
            type: Number,
            default: 5.1144
        },
        INRperCAD: {
            type: Number,
            default: 60.9481
        },
        AUDperCAD: {
            type: Number,
            default: 1.1160
        },
        NZDperCAD: {
            type: Number,
            default: 1.1993
        },
        ETHperCAD: {
            type: Number,
            default: 0.00041
        },
        ADAperCAD: {
            type: Number,
            default: 2.0571
        },
        DOGEperCAD: {
            type: Number,
            default: 10.2578
        },
    },
    GBP:{
        USDperGBP: {
            type: Number,
            default: 1.2468
        },
        CADperGBP: {
            type: Number,
            default: 1.6734
        },
        JPYperGBP: {
            type: Number,
            default: 166.1050
        },
        EURperGBP: {
            type: Number,
            default: 1.1388
        },
        CNYperGBP: {
            type: Number,
            default: 8.5571
        },
        INRperGBP: {
            type: Number,
            default: 101.9744
        },
        AUDperGBP: {
            type: Number,
            default: 1.8677
        },
        NZDperGBP: {
            type: Number,
            default: 2.0067
        },
        ETHperGBP: {
            type: Number,
            default: 0.00068
        },
        ADAperGBP: {
            type: Number,
            default: 3.4764
        },
        DOGEperGBP: {
            type: Number,
            default: 17.3461
        },
    },
    JPY:{
        USDperJPY: {
            type: Number,
            default: 0.0075
        },
        CADperJPY: {
            type: Number,
            default: 0.0101
        },
        GBPperJPY: {
            type: Number,
            default: 0.0060
        },
        EURperJPY: {
            type: Number,
            default: 0.0068
        },
        INRperJPY: {
            type: Number,
            default: 0.6139
        },
        CNYperJPY: {
            type: Number,
            default: 0.0515
        },
        AUDperJPY: {
            type: Number,
            default: 0.0112
        },
        NZDperJPY: {
            type: Number,
            default: 0.0121
        },
        ETHperJPY: {
            type: Number,
            default: 0.00000398
        },
        ADAperJPY: {
            type: Number,
            default: 0.0204
        },
        DOGEperJPY: {
            type: Number,
            default: 0.1015
        },
    },
    EUR:{
        USDperEUR: {
            type: Number,
            default: 1.0914
        },
        CADperEUR: {
            type: Number,
            default: 1.4696
        },
        GBPperEUR: {
            type: Number,
            default: 0.8783
        },
        JPYperEUR: {
            type: Number,
            default: 145.9205
        },
        CNYperEUR: {
            type: Number,
            default: 7.5168
        },
        INRperEUR: {
            type: Number,
            default: 89.5796
        },
        AUDperEUR: {
            type: Number,
            default: 1.64053
        },
        NZDperEUR: {
            type: Number,
            default: 1.76250
        },
        ETHperEUR: {
            type: Number,
            default: 0.00059
        },
        ADAperEUR: {
            type: Number,
            default: 3.0193
        },
        DOGEperEUR: {
            type: Number,
            default: 15.0489
        },
    },
    CNY:{
        USDperCNY: {
            type: Number,
            default: 0.1452
        },
        CADperCNY: {
            type: Number,
            default: 0.1955
        },
        GBPperCNY: {
            type: Number,
            default: 0.1168
        },
        JPYperCNY: {
            type: Number,
            default: 19.4097
        },
        EURperCNY: {
            type: Number,
            default: 0.1330
        },
        INRperCNY: {
            type: Number,
            default: 11.9161
        },
        AUDperCNY: {
            type: Number,
            default: 0.2183
        },
        NZDperCNY: {
            type: Number,
            default: 0.2345
        },
        ETHperCNY: {
            type: Number,
            default: 0.000078
        },
        ADAperCNY: {
            type: Number,
            default: 0.39856
        },
        DOGEperCNY: {
            type: Number,
            default: 1.9858
        },
    },
    AUD:{
        USDperAUD: {
            type: Number,
            default: 0.6650
        },
        CADperAUD: {
            type: Number,
            default: 0.8955
        },
        GBPperAUD: {
            type: Number,
            default: 0.5350
        },
        JPYperAUD: {
            type: Number,
            default: 88.9026
        },
        EURperAUD: {
            type: Number,
            default: 0.6092
        },
        CNYperAUD: {
            type: Number,
            default: 4.5802
        },
        INRperAUD: {
            type: Number,
            default: 54.5779
        },
        NZDperAUD: {
            type: Number,
            default: 1.07422
        },
        ETHperAUD: {
            type: Number,
            default: 0.0004
        },
        ADAperAUD: {
            type: Number,
            default: 2.0608
        },
        DOGEperAUD: {
            type: Number,
            default: 10.26539
        },
    },
    NZD:{
        USDperNZD: {
            type: Number,
            default: 0.6190
        },
        CADperNZD: {
            type: Number,
            default: 0.8335
        },
        GBPperNZD: {
            type: Number,
            default: 0.4980
        },
        JPYperNZD: {
            type: Number,
            default: 82.7583
        },
        EURperNZD: {
            type: Number,
            default: 0.5671
        },
        CNYperNZD: {
            type: Number,
            default: 4.2635
        },
        INRperNZD: {
            type: Number,
            default: 50.8034
        },
        AUDperNZD: {
            type: Number,
            default: 0.9309
        },
        ETHperNZD: {
            type: Number,
            default: 0.00034
        },
        ADAperNZD: {
            type: Number,
            default: 1.746747
        },
        DOGEperNZD: {
            type: Number,
            default: 8.7061317
        },
    },
    INR:{
        USDperINR: {
            type: Number,
            default: 0.0121
        },
        CADperINR: {
            type: Number,
            default: 0.0164
        },
        GBPperINR: {
            type: Number,
            default: 0.0098
        },
        JPYperINR: {
            type: Number,
            default: 1.6288
        },
        EURperINR: {
            type: Number,
            default: 0.0111
        },
        CNYperINR: {
            type: Number,
            default: 0.0839
        },
        NZDperINR: {
            type: Number,
            default: 0.0196
        },
        AUDperINR: {
            type: Number,
            default: 0.0183
        },
        ETHperINR: {
            type: Number,
            default: 0.00000659
        },
        ADAperINR: {
            type: Number,
            default: 0.03359
        },
        DOGEperINR: {
            type: Number,
            default: 0.167419
        },
    },
});

module.exports = mongoose.model('ForexRate', forexRateSchema, 'forexrates');