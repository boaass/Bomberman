import { DIR } from "game";

cc.Class({
    extends: cc.Component,

    properties: {
        steerType : {
            default : "",
        }
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_START, function(event){
            // console.log('touch start');
            this.node.parent.parent.emit('steerBtnHoldTouch', this.steerType);
        }, this);

        this.node.on(cc.Node.EventType.TOUCH_END, function(event){
            // console.log('touch end');
            this.node.parent.parent.emit('steerBtnTouchEnd', this.steerType);
        }, this);
    },

    start () {

    },

    // update (dt) {},
});
