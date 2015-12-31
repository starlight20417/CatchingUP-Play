//主程序,业务逻辑
(function(){
	var game = new Game('canvas');
	//启动页
	(function(){
		var stage = game.createStage();
		stage.bind('keydown',function(e){
			game.nextStage();
		});
		//logo
		var item = stage.createItem({
			x:game.width/2,
			y:game.height*.45,
			width:100,
			height:100,
			speed:10,
			update:function(context){
				context.fillStyle = '#FC3';
				context.beginPath();
				if(this.times%2){
					context.arc(this.x,this.y,this.width/2,.20*Math.PI,1.80*Math.PI,false);
				}else{
					context.arc(this.x,this.y,this.width/2,.01*Math.PI,1.99*Math.PI,false);
				}
				context.lineTo(this.x,this.y);
				context.closePath();
				context.fill();
				context.fillStyle = '#000';
				context.beginPath();
				context.arc(this.x+5,this.y-27,7,0,2*Math.PI,false);
				context.closePath();
				context.fill();
			}
		});
		item.bind('click',function(){
			console.log('不要点我！');
		});
		//游戏名
		var item2 = stage.createItem({
			x:game.width/2,
			y:game.height*.6,
			update:function(context){
				context.font = 'bold 42px Helvetica';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillStyle = '#FFF';
				context.fillText('Pac-Man',this.x,this.y);
			}
		});
		//版权信息
		stage.createItem({
			x:game.width-12,
			y:game.height-5,
			update:function(context){
				context.font = '14px Helvetica';
				context.textAlign = 'right';
				context.textBaseline = 'bottom';
				context.fillStyle = '#AAA';
				context.fillText('© passer-by.com',this.x,this.y);
			}
		});
	})();
	//游戏主程序
	(function(){
		var stage = game.createStage();
		stage.bind('keydown',function(){
			console.log('没东西啦……还按！');
		});
	})();
	game.init();
})();