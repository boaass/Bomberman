export const DIR = cc.Enum({
    UP:'up',
    RIGHT:'right',
    DOWN:'down',
    LEFT:'left'
});

cc.Class({
    extends: cc.Component,

    properties: {

        bombPrefab:{
            default:null ,
            type:cc.Prefab,
        },

        map:{
            default:null ,
            type:cc.TiledMap,
        },
        hideLayer:{
            default:null,
            type:cc.TiledLayer,
        },
        mainLayer:{
            default:null,
            type:cc.TiledLayer,
        },
        soilLayer:{
            default:null,
            type:cc.TiledLayer,
        },
        player:{
            default:null,
            type:cc.Node,
        },
        enemy:{
            default:null,
            type:cc.Node,
        },
        // 轮盘长按计时
        timer : 0,
        // 地图上的有效
        vaildBombs : [],
        // 
        isPlayerDeading : false,
        isEnemyDeading : false,
    },

    // use this for initialization
    onLoad: function () {
        let self = this ;
        this.bombPool = new cc.NodePool('bomb');
        this.loadMap();

        // 炸弹爆炸回调
        this.map.node.on("exploded" ,function(event){
            let currentBomb = event.detail;
            let currentBombTilePos = self.getTilePosition(cc.p(currentBomb.x, currentBomb.y));
            // 检查炸弹的上下左右是否是soil
            if(self.soilLayer.getTileGIDAt(cc.p(currentBombTilePos.x ,currentBombTilePos.y - 1 ))){
                // 炸弹上面是soil，可炸
                self.soilLayer.removeTileAt(cc.p(currentBombTilePos.x ,currentBombTilePos.y - 1 )) ;
            }
            if(self.soilLayer.getTileGIDAt(cc.p(currentBombTilePos.x ,currentBombTilePos.y + 1))){
                // 炸弹下面是soil，可炸
                self.soilLayer.removeTileAt(cc.p(currentBombTilePos.x ,currentBombTilePos.y + 1 )) ;
            }
            if(self.soilLayer.getTileGIDAt(cc.p(currentBombTilePos.x - 1 ,currentBombTilePos.y))){
                // 炸弹左面是soil，可炸
                self.soilLayer.removeTileAt(cc.p(currentBombTilePos.x - 1,currentBombTilePos.y)) ;
            }
            if(self.soilLayer.getTileGIDAt(cc.p(currentBombTilePos.x + 1,currentBombTilePos.y))){
                // 炸弹右面是soil，可炸
                self.soilLayer.removeTileAt(cc.p(currentBombTilePos.x + 1 ,currentBombTilePos.y )) ;
            }
            // 检查炸弹的上下左右是否是主角
            if(cc.pointEqualToPoint(cc.p(self.playerTile.x, self.playerTile.y), cc.p(currentBombTilePos.x ,currentBombTilePos.y - 1 ))){
                // 炸弹上面是player，可炸
                self.gameover();
            }
            if(cc.pointEqualToPoint(cc.p(self.playerTile.x, self.playerTile.y), cc.p(currentBombTilePos.x ,currentBombTilePos.y + 1 ))){
                // 炸弹下面是player，可炸
                self.gameover();
            }
            if(cc.pointEqualToPoint(cc.p(self.playerTile.x, self.playerTile.y), cc.p(currentBombTilePos.x - 1 ,currentBombTilePos.y))){
                // 炸弹左面是player，可炸
                self.gameover();
            }
            if(cc.pointEqualToPoint(cc.p(self.playerTile.x, self.playerTile.y), cc.p(currentBombTilePos.x + 1 ,currentBombTilePos.y))){
                // 炸弹右面是player，可炸
                self.gameover();
            }
            if(cc.pointEqualToPoint(cc.p(self.playerTile.x, self.playerTile.y), cc.p(currentBombTilePos.x,currentBombTilePos.y))){
                // 炸弹与player位置重合，可炸
                self.gameover();
            }
            
            // 检查炸弹的上下左右是否是敌人
            if(cc.pointEqualToPoint(cc.p(self.enemyTile.x, self.enemyTile.y), cc.p(currentBombTilePos.x ,currentBombTilePos.y - 1 ))){
                // 炸弹上面是enemy，可炸
                self.enemyDead();
            }
            if(cc.pointEqualToPoint(cc.p(self.enemyTile.x, self.enemyTile.y), cc.p(currentBombTilePos.x ,currentBombTilePos.y + 1 ))){
                // 炸弹下面是enemy，可炸
                self.enemy.getComponent('enemy').dead();
            }
            if(cc.pointEqualToPoint(cc.p(self.enemyTile.x, self.enemyTile.y), cc.p(currentBombTilePos.x - 1 ,currentBombTilePos.y))){
                // 炸弹左面是enemy，可炸
                self.enemy.getComponent('enemy').dead();
            }
            if(cc.pointEqualToPoint(cc.p(self.enemyTile.x, self.enemyTile.y), cc.p(currentBombTilePos.x + 1 ,currentBombTilePos.y))){
                // 炸弹右面是enemy，可炸
                self.enemy.getComponent('enemy').dead();
            }
            if(cc.pointEqualToPoint(cc.p(self.enemyTile.x, self.enemyTile.y), cc.p(currentBombTilePos.x,currentBombTilePos.y))){
                // 炸弹与player位置重合，可炸
                self.enemy.getComponent('enemy').dead();
            }
            // 把炸弹移除掉
            let bomb = event.detail;
            self.bombPool.put(bomb);

            self.vaildBombs.pop(bomb);
        });

        // 主角死亡回调
        self.map.node.on("player_dead", function(){
            console.log('player dead');
            self.player.removeFromParent();
            cc.director.loadScene('gameover');
        });

        self.map.node.on("enemy_dead", function(){
            console.log('enemy dead');
            self.enemy.removeFromParent();
            cc.director.loadScene('gamewin');
        });

        // 轮盘按下回调
        self.map.node.parent.on('steerBtnHoldTouch', function(event){
            this.timer = 0;
            let eventTagetName = event.detail;
            self.playerDir = eventTagetName;
            self.steerBtnTouching = true;
            self.playerMove();
        });

        // 轮盘抬起回调
        self.map.node.parent.on('steerBtnTouchEnd', function(event){
            self.steerBtnTouching = false;
            this.timer = 0;
        });
    },

    btnBomb:function(){
        let bomb = this.bombPool.get();
        if (bomb == null) {
            bomb = cc.instantiate(this.bombPrefab);
        }
        bomb.parent = this.map.node;
        this.bombTile = this.playerTile ;
        let pos = this.mainLayer.getPositionAt(this.bombTile);
        bomb.setPosition(pos);
        bomb.setAnchorPoint(0, 0);
        bomb.getComponent(cc.Animation).play('explode');
        
        this.vaildBombs.push(bomb);
    },

    // btnDown:function(){
    //     this.playerDir = DIR.DOWN ;
    //     let playerTarTile = cc.p(this.playerTile.x ,this.playerTile.y + 1) ;
    //     this.tryMoveToTarTile(playerTarTile) ;
    // },
    // btnUp:function(){
    //     this.playerDir = DIR.UP ;
    //     let playerTarTile = cc.p(this.playerTile.x ,this.playerTile.y - 1) ;
    //     this.tryMoveToTarTile(playerTarTile) ;
    // },
    // btnLeft:function(){
    //     this.playerDir = DIR.LEFT ;
    //     let playerTarTile = cc.p(this.playerTile.x -1 ,this.playerTile.y) ;
    //     this.tryMoveToTarTile(playerTarTile) ;
    // },
    // btnRight:function(){
    //     this.playerDir = DIR.RIGHT ;
    //     let playerTarTile = cc.p(this.playerTile.x +1 ,this.playerTile.y) ;
    //     this.tryMoveToTarTile(playerTarTile) ;
    // },

    tryMoveToTarTile:function(newTile){
        // 让玩家别撞到了墙上
        if(this.mainLayer.getTileGIDAt(newTile)){
            cc.log('hit the wall .') ;
            return false ;
        }
        if(this.soilLayer.getTileGIDAt(newTile)){
            cc.log('hit the soil .') ;
            return false ;
        }

        this.playerTile = newTile ;
        this.updatePlayerPos() ;

        let currentGid = this.hideLayer.getTileGIDAt(newTile);

        if (currentGid === 4) {
            // 过关
            console.log('currentGid-----', 3);
            cc.director.loadScene('gamewin');
            return;
        }
        if (currentGid === 5) {
            // 加一条命
        }
        if (currentGid === 6) {
            // 增加炸弹威力
        }
        if (currentGid === 7) {
            // 增加移动速度
        }
        if (currentGid === 8) {
            // 增加炸弹个数
        }
        if (currentGid) {
            this.hideLayer.removeTileAt(newTile);
        }
    },

    loadMap:function(){
        // 获取对象层
        let objects = this.map.getObjectGroup('objects') ;
        // 获取对象
        let playerObj = objects.getObject('player') ;
        let enemyObj = objects.getObject('enemy') ;
        // 获取坐标
        let playerPos = cc.p(playerObj.offset.x ,playerObj.offset.y) ;
        let enemyPos  = cc.p(enemyObj.offset.x ,enemyObj.offset.y) ;

        // 玩家和敌人的瓦片坐标
        let tileSize = this.map.getTileSize();
        this.playerTile = cc.p(playerPos.x/tileSize.width, playerPos.y/tileSize.height);
        this.enemyTile = cc.p(enemyPos.x/tileSize.width, enemyPos.y/tileSize.height);
        // this.playerTile = cc.p(1,1) ;
        // this.enemyTile  = cc.p(1,17) ;

        // 设置敌人的位置
        let pos2 = this.mainLayer.getPositionAt(this.enemyTile) ;
        this.enemy.setPosition(pos2) ;
        this.enemyDir = DIR.RIGHT ;

        // 更新玩家的位置
        this.updatePlayerPos() ;
        this.playerDir = DIR.DOWN ;
    },

    updatePlayerPos:function(){
        let pos = this.mainLayer.getPositionAt(this.playerTile) ;
        this.player.setPosition(pos) ;
    },

    // 主角移动
    playerMove:function(){
        if (this.isPlayerDeading) {
            return;
        }

        for (let index = 0; index < this.vaildBombs.length; index++) {
            const bomb = this.vaildBombs[index];
            if (this.player.y == bomb.y) {
                if (this.playerDir == DIR.RIGHT) {
                    if ((this.player.x+this.player.width) == bomb.x) {
                        return;
                    }
                } else {
                    if (this.player.x == (bomb.x+bomb.width)) {
                        return;
                    }
                }
            }
        }

        if(this.playerDir === DIR.RIGHT){
            if (this.player.x < 544) {
                let playerTarTile = cc.p(this.playerTile.x + 1 ,this.playerTile.y) ;
                this.tryMoveToTarTile(playerTarTile) ;
            }
        }
        if (this.playerDir === DIR.UP) {
            if (this.player.y < 544) {
                let playerTarTile = cc.p(this.playerTile.x ,this.playerTile.y - 1) ;
                this.tryMoveToTarTile(playerTarTile) ;
            }
        }
        if (this.playerDir === DIR.LEFT) {
            if (this.player.x > 0) {
                let playerTarTile = cc.p(this.playerTile.x - 1 ,this.playerTile.y) ;
                this.tryMoveToTarTile(playerTarTile) ;
            }
        }
        if (this.playerDir === DIR.DOWN) {
            if (this.player.y > 0) {
                let playerTarTile = cc.p(this.playerTile.x ,this.playerTile.y + 1) ;
                this.tryMoveToTarTile(playerTarTile) ;
            }
        }
    },

    enemyDead:function(){
        this.isEnemyDeading = true;
        this.enemy.getComponent('enemy').dead();
    },

    // 主角死亡
    gameover:function(){
        this.isPlayerDeading = true;
        this.player.getComponent('player').dead();
    },

    // 将地图中的坐标转为瓦片的坐标
    getTilePosition:function(posInPixel){
        let mapSize = this.node.getContentSize();
        let tileSize = this.map.getTileSize();
        let x = Math.floor(posInPixel.x / tileSize.width) ;
        let y = Math.floor((mapSize.height-posInPixel.y-tileSize.width) / tileSize.height) ;
        return cc.p(x ,y) ;
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        let self = this;
        // 检查玩家是否和敌人进行了碰撞
        let playerPos = cc.p(self.player.x, self.player.y);
        let enemyPos = cc.p(self.enemy.x, self.enemy.y);
        if(cc.pointEqualToPoint(playerPos, enemyPos)){
            cc.log('hit the enemy .') ;
            self.gameover();
        }
        
        // 检测炸弹碰撞
        for (let index = 0; index < self.vaildBombs.length; index++) {
            const bomb = self.vaildBombs[index];
            if (self.enemy.y == bomb.y) {
                if (self.enemyDir == DIR.RIGHT) {
                    if ((self.enemy.x+self.enemy.width) == bomb.x) {
                        self.enemyDir = DIR.LEFT;
                    }
                } else {
                    if (self.enemy.x == (bomb.x+bomb.width)) {
                        self.enemyDir = DIR.RIGHT;
                    }
                }
            }
        }
        
        // 检测怪物边界碰撞
        if (!self.isEnemyDeading) {
            if(self.enemyDir == DIR.RIGHT){
                if(self.enemy.x > 544){
                    self.enemyDir = DIR.LEFT ;
                } else {
                    self.enemy.x++ ;
                }
            }else{
                if(self.enemy.x < 32){
                    self.enemyDir = DIR.RIGHT ;
                } else {
                    self.enemy.x-- ;
                }
            }
        }

        // 主角移动
        if (self.steerBtnTouching && (self.timer < 0.3)) {
            self.timer += dt;
            return;
        }

        if (self.steerBtnTouching && (self.timer >= 0.3)) {
            self.timer = 0;
            self.playerMove();
        }
    },
});
