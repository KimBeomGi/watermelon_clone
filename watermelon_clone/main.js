import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js"
import { FRUITS_BASE } from "../fruits"

const engine = Engine.create()
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  }
})

const world = engine.world

// 위치(15, 395), 너비 30, 높이 790
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true, // isStatic: false로 되어있으면 얘도 떨어짐
  render: { fillStyle: "#E6B143"}
})
const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143"}
})
const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143"}
})
const topLine = Bodies.rectangle(310, 150, 620, 2, {
  name : "topLine",
  isStatic: true,
  isSensor: true, // 부딪히지 않고 감지만 함.
  render: { fillStyle: "#E6B143"}
})

const positionLine = Bodies.rectangle(310, 500, 0.5, 700, {
  name : "positionLine",
  isStatic: true,
  isSensor: true, // 부딪히지 않고 감지만 함.
  render: { fillStyle: "#E6B143"}
})

World.add(world, [leftWall, rightWall, ground, topLine, positionLine])

Render.run(render)
// Runner.run(engine);  // 이렇게 하니 작동을 하지 않아서, 아래 두 줄로 해결
const runner = Runner.create()
Runner.run(runner, engine)

let currentBody = null
let currentFruit = null
let disableAction = false

let interval = null // 부드럽게 좌우로 움직이게 하기 위함

let num_suika = 0

function addFruit(){
  const index = Math.floor(Math.random() * 5)
  const fruit = FRUITS_BASE[index]
  const body = Bodies.circle(310, 50, fruit.radius, {
    isSleeping: true, // isSleeping: true 로 하면 떨어지지 않는 대기 상태
    index: index,
    render: {
      sprite: { texture: `${fruit.name}.png`}
    },
    restitution: 0.3,
  })
  currentBody = body
  currentFruit = fruit
  
  World.add(world, body)
}

render.canvas.addEventListener('mousemove', (event) => {
  if (currentBody && !disableAction) {
    const canvasBounds = render.canvas.getBoundingClientRect()
    const mouseX = event.clientX - canvasBounds.left

    // 마우스 위치를 currentBody의 위치로 설정
    if (30 < mouseX - currentFruit.radius && mouseX + currentFruit.radius < 590) {
      Body.setPosition(currentBody, {
        x: mouseX,
        y: currentBody.position.y,
      })

      // positionLine의 x 좌표를 mouseX로 설정
      Body.setPosition(positionLine, {
        x: mouseX,
        y: positionLine.position.y,
      })
    }
  }
})
render.canvas.addEventListener('click', (event) => {
  if (disableAction) {
    return
  }
  currentBody.isSleeping = false
  disableAction = true
  setTimeout(() => {
    addFruit()
    // positionLine의 x 좌표를 기본 좌표로 설정
    Body.setPosition(positionLine, {
      x: 310,
      y: positionLine.position.y,
    })
    disableAction = false
  }, 1000)
})


window.onkeydown = (event) => {
  if(disableAction){
    return
  }
  switch(event.code){
    case "KeyA":
      if(interval){
        return
      }
      interval = setInterval(() => {
        if(currentBody.position.x - currentFruit.radius > 30){
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          })
          // positionLine의 x 좌표를 조정
          Body.setPosition(positionLine, {
            x: currentBody.position.x - 1,
            y: positionLine.position.y,
          })
        }
      }, 5)
      break
    case "KeyD":
      if(interval){
        return
      }
      interval = setInterval(() => {
        if(currentBody.position.x + currentFruit.radius < 590){
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          })
          // positionLine의 x 좌표를 조정
          Body.setPosition(positionLine, {
            x: currentBody.position.x - 1,
            y: positionLine.position.y,
          })
        }
      }, 5)
      break
    case "KeyS":
      currentBody.isSleeping = false
      disableAction = true
      setTimeout(() => {
        addFruit()
        // positionLine의 x 좌표를 기본 좌표로 설정
        Body.setPosition(positionLine, {
          x: 310,
          y: positionLine.position.y,
        })
        disableAction = false
      }, 1000)
      break
  }
}

window.onkeyup = (event) => {
  switch (event.code){
    case "KeyA":
    case "KeyD":
      clearInterval(interval)
      interval = null
  }
}

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if(collision.bodyA.index == collision.bodyB.index){
      const index = collision.bodyA.index
      if(index === FRUITS_BASE.length - 1){
        num_suika++ 
        if(num_suika == 2){
          alert('Win!!!!!!')
        }
        return
      }
      World.remove(world, [collision.bodyA, collision.bodyB])

      const newFruit = FRUITS_BASE[index + 1]
      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            sprite: { texture: `${newFruit.name}.png`}
          },
          index: index + 1
        }
      )
      World.add(world, newBody)
    }

    if (!disableAction && (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")){
      alert("Game over")
    }
  });
})

addFruit()