var amqp = require('amqplib/callback_api')


const AMQP_URL = `amqp://temp:temp@39.117.253.166:5672`
const QUEUE = 'keepalive.queue'
const KEEP_ALIVE_ROUTE = 'keepalive.route'
const KEEP_ALIVE_TOPIC = 'keepalive'

const ESTABLISH_ROUTE = 'establish.route'
const ESTABLISH_TOPIC = 'establish'

var keepAliveInterval = null;

module.exports = {
    init: (hubAuthKey, externalIp, port) => {

        amqp.connect(AMQP_URL, (err,conn)=>{

            //에러 발생 시 초기화 중지
            if(err){
                loggerFactory.error('AMQP connection is failed');
                return;
            }
            
            conn.createChannel((err,ch)=>{

                if(err){
                    loggerFactory.error('AMQP channel creation is failed');
                    return;
                }

                //SIBA platform이랑 연결 수립
                ch.publish(ESTABLISH_TOPIC, ESTABLISH_ROUTE, Buffer.from(JSON.stringify({
                    id:hubAuthKey,
                    ip:externalIp,
                    port: port
                })), {contentType: 'application/json'})

                //interval이 존재 한다면 해제
                if(keepAliveInterval){
                    clearInterval(keepAliveInterval);
                }

                //3초마다 keep-alive packet 전송
                keepAliveInterval = setInterval(()=>{
                    ch.publish(KEEP_ALIVE_TOPIC, KEEP_ALIVE_ROUTE, Buffer.from(JSON.stringify({
                        id:hubAuthKey
                    })), {contentType: 'application/json'})
                }, 3000)
            })
        })
    }
}