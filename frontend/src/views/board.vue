<template>
  <section  :style="{backgroundImage: 'url('+bgImg+')' }" class="board flex column" style="height: 100vh" v-if="board">
    <div v-if="isOverlayEffect" class="effect" @click="closeOverlayEffect"></div>
    <charts-modal v-if="isDashboards" @closeChartsModal="dashbordsToShow"></charts-modal>
  <div class="board-vue">
    <task-edit @removeTaskEv="removeTask" />
    <task-details @updateActivityLogEv='updateActivityLog' @updateTaskEv="updateTask" @removeTaskEv="removeTask"></task-details>
    <div class="info flex align-center space-between">
      <avatar class="members flex" :users="board.members" context="board" />
      <div>
        <button class="btn-dashboards" @click="dashbordsToShow">
          <i class="fas fa-chart-pie"></i>
          <!-- Dashboards -->
        </button>
        <button id="draggable" class="btn-add-member" @click="addMemberModal">
          <i class="fas fa-user-plus"></i>
          <!-- Add member -->
        </button>
      </div>
      <board-new-member-modal
        v-if="isAddMemberModal"
        @closeAddMemberModal="closeAddMemberModal"
        @addMemberToBoard="addMemberToBoard"
      ></board-new-member-modal>
    </div>
  </div>
    <div class="board-page">
      <div class="flex closer">
        <draggable
        
        handle=".handle , .tasks-container"
          class="list-group closer flex flex-start sortable-fallback"
          tag="div"
          v-bind="dragOptions"
          v-model="board.taskGroups"
          group="columns"
          @start="drag=true"
          @end="drag=false ; updateBoard(board)"
        >
          <div class="sortable-fallback" v-for="taskGroup in board.taskGroups" :key="taskGroup.id">
            <task-group 
            :id="taskGroup._id"
           
            class="list-group-item sortable-fallback"
             
             @updateActivityLogEv='updateActivityLog'
              @duplicateTaskGroupEv="duplicateTaskGroup"
              @removeTaskGroupEv="removeTaskGroup"
              @updateBoardEv="updateBoard(board)"
              :taskGroup="taskGroup"
            ></task-group>
          </div>
        </draggable>
        <div @click="addingTask = true" class="task-add flex justify-center align-center closer">
          <div @click="addingTask = true" class="closer" v-if="!addingTask">Add task group</div>
          <div class="add-group-inputs flex column" v-if="addingTask">
            <input ref="taskGroupTitle" placeholder="Enter a title" type="text" v-model="newGroupTitle" />
            <div class="flex align-center space-around">
              <button
                class="btn-save-group"
                @click.stop="createTaskGroup(newGroupTitle),newGroupTitle = '' "
              >Add Group</button>
              <button class="btn-close" @click.stop="addingTask = !addingTask">
                <i class="fas fa-times fa-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  <!-- </div> -->
  </section>
</template>



<script>
import draggable from "vuedraggable";
import interact from "interactjs";
import taskGroup from "../components/taskGroup.vue";
import taskDetails from "../components/taskDetails.vue";
import taskEdit from "../components/taskEdit.vue";
import { taskGroupService } from "../services/task-group-service.js";
// import {boardService} from '../services/board-service.js'
var boardService = require("../services/board-service.js");
import SocketService from "../services/SocketService";
import Avatar from "../components/avatar.vue";
import boardNewMemberModal from "../components/boardNewMemberModal.vue";
import chartsModal from '../components/chartsModal.vue';
import $ from "jquery";
import 'jquery-sortablejs';


import {
  eventBus,
  OVERLAY_EFFECT,
  STOP_OVERLEY_EFFECT
} from "../services/event-bus.service";


export default {
  data() {
    return {
      dragTargetEv: null,
      isDragging: false,
      elClone: null,
      elementToClone: null,
      board: null,
      newGroupTitle: "",
      addingTask: false,
      isAddMemberModal: false,
      isOverlayEffect: false,
      isDashboards: false,
      bgImg: null
    };
  },
  computed: {
    isAdding() {
      return this.addingTask;
      // this.$store.getters.currBoard
    },
    isBoardReady() {
             if (this.board) return 
    
  },
  },

  created() {


this.$store.dispatch({ type: "loadUsers" })
    this.$store.dispatch({ type: 'loadBoard' , id: this.$route.params.id }).then(board => {
      this.board = board;
      this.bgImg = require(`../assets/imgs/board-img-${this.board.backgroundImg}.jpg`) 
    
      SocketService.setup();
      SocketService.emit("boardJoined", this.board._id);
      SocketService.on("boardUpdate", this.onUpdateBoard);
     
    });
    window.onclick = function(ev) {
      if (ev.target.classList.contains("closer")) {
        this.addingTask = false;
        // eventBus.$emit("closer-clicked");
      }
      // console.log('window clickied', ev.target.classList[0]);
    };

    eventBus.$on("closer-clicked", () => {
      this.addingTask = false;
    });

    eventBus.$on(OVERLAY_EFFECT, () => {
      this.isOverlayEffect = true;
    });

    eventBus.$on(STOP_OVERLEY_EFFECT, () => {
      this.isOverlayEffect = false;
    });
  },
  destroyed() {
    SocketService.off("boardUpdate", this.onUpdateBoard);
    SocketService.terminate();
    window.onclick = null;
  },

  methods: {
      closeOverlayEffect() {
        this.isOverlayEffect = false;
        eventBus.$emit("closer-clicked");
      },

    dashbordsToShow(){
      this.isDashboards = !this.isDashboards
    },



    removeTask(task) {
      this.$store.dispatch({ type: "removeTask", task });
      // this.task = null;
    },
    updateBoard(board) {
      this.board.taskGroups.forEach(taskGroupItem => {
        taskGroupItem.tasks.forEach(
          task => {
           if(task.taskGroup !== taskGroupItem._id){
             let activity = {
              type: "MOVE", txt: ` moved this card from ${this.getTaskGroupTitle(task.taskGroup)}
                to  ${this.getTaskGroupTitle(taskGroupItem._id)} `, task: task}
                  this.updateActivityLog(activity)
                   task.taskGroup = taskGroupItem._id
           }
          }
        );
      });

      this.$store.dispatch({ type: "updateBoard", board });
    },
    
    getTaskGroupTitle(id) {
    // console.log('task GROP', this.$store.getters.currBoard);
    let taskGroup = this.board.taskGroups.find(taskGroupItem => taskGroupItem._id === id)
    return taskGroup.title
},

    onUpdateBoard(board) {
      this.$store.commit({ type: "saveBoard", board });
      this.board = board;
    },
    updateTask(task) {
      this.$store.dispatch({ type: "updateTask", task: task });
    },
    createTaskGroup(title) {
      this.addingTask = false;
      this.$store.dispatch({ type: "addTaskGroup", title });
    },
    duplicateTaskGroup(taskGroup) {
      this.$store.dispatch({ type: "duplicateTaskGroup", taskGroup });
    },

    removeTaskGroup(taskGroup) {
      this.$store.dispatch({ type: "removeTaskGroup", taskGroup });
    },
    addMemberModal() {
      this.isAddMemberModal = true;
    },
    closeAddMemberModal() {
      this.isAddMemberModal = !this.isAddMemberModal;
    },
    addMemberToBoard(user) {
      this.$store.dispatch({ type: "addMemberToBoard", user });
    },
    updateActivityLog(activity){
      
      activity.user = this.$store.getters.loggedinUser
      this.$store.dispatch({ type: "updateActivityLog", activity});
    }
  },
  computed: {
    dragOptions() {
      return {
        filter: ".ignore-elements",
        forceFallback: true,  // ignore the HTML5 DnD behaviour and force the fallback to kick in
       	fallbackClass: "sortable-fallback",  // Class name for the cloned DOM Element when using forceFallback
	      fallbackOnBody: true,  // Appends the cloned DOM Element into the Document's Body
      	fallbackTolerance: 5, // Specify in pixels how far the mouse should move before it's considered as a drag.
        touchStartThreshold: 5,
        // fallbackTolerance: 5,
        animation: 400,
        group: "description",
        disabled: false,
        ghostClass: "tghost",
        chosenClass: "tchosen-class",
        dragClass: "tdrag-class"
      };
    }
  },
  components: {
    taskGroup,
    draggable,
    taskDetails,
    taskEdit,
    Avatar,
    boardNewMemberModal,
    chartsModal
  },

  updated() {
    if (this.addingTask) {
       this.$refs.taskGroupTitle.focus();
    }
  }

}
</script>

<style lang="scss" >
.sortable-drag{
  // opacity: 1;
}
.sortable-chosen{
  // opacity: 1;
}
.effect {
  position: fixed; 
  width: 100%; 
  height: 100%; 
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 1; 
  cursor: pointer; 
}
.board-page {
  width: 100%;
  overflow-x: auto;
  flex: 1;
  overflow-x: auto;
  margin-bottom: 5px;
  // padding-bottom: 28px;
        // max-height: 60vh;
        &::-webkit-scrollbar-track {
            // -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            background-color: #212623d9
        }
        &::-webkit-scrollbar {
            width: 8px;
            background-color: #212623d9;
        }
        &::-webkit-scrollbar-thumb {
            border-radius: 8px;
            // -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .3);
            background-color: #808b914d;
        }
    }
.btn-add-member {
  background-color: rgba($color: #e6dcdc, $alpha: 0.5);
  margin-left: 15px;
  border-radius: 4px;
  border: 0;
  outline: 0;
  // width: 115px;
  width: 45px;
  height: 33px;
  // float: right;
  cursor: pointer;
  // transition: ease-in 0.9;
  &:hover {
    background-color: rgba($color: #c5bebe, $alpha: 0.5);
  }

  i {
    font-size: 1.2rem;
  }
}
.btn-dashboards {
  background-color: rgba($color: #e6dcdc, $alpha: 0.5);
  margin-left: 15px;
  border-radius: 4px;
  border: 0;
  outline: 0;
  // width: 115px;
  width: 45px;
  height: 33px;
  // float: right;
  cursor: pointer;
  // transition: ease-in 0.9;
  &:hover {
    background-color: rgba($color: #c5bebe, $alpha: 0.5);
  }

    i {
    font-size: 1.2rem;
  }
}
.tghost {
  opacity: 1;
  
}
.tchosen-class {
  opacity: 0.3;
}
    .tdrag-class {
      opacity: 1!important;
      transition: rotate 1s;
      transform: rotate(10deg)
      // background: rgba($color: #e71818, $alpha: 1);
    }
  .tree-node.dragging{
    opacity: 1!important;
  }
  .sortable-fallback {
   
  }
.clone {
  // position: absolute;
  // transition: rotate 0.3;
 transform: rotate(10deg);
 
 width: 252px;
   pointer-events: none;
  //  display : none;
}
.pointer-events {
  pointer-events: none;
}

.btn-save-group {
  background-color: #5aac44;
  color: #fbfdfb;
  font-size: 0.9rem;
  padding: 10px;
  border-radius: 3px;
  float: left;
  margin-left: 10px;
  margin-bottom: 10px;
  border: 0;
  cursor: pointer;
  outline: none;

  &:hover {
    background-color: #61bd4f;
  }
}

.add-group-inputs {
  margin-top: 10px;
  justify-content: center;
  align-items: center;
  .btn-close {
    // float: left;
    margin-left: 10px;
    // margin-top: 10px;
    font-size: 1.2rem;
    // font-size: 16px;
    border: 0;
    cursor: pointer;
    outline: none;
    // width: 30px;
    background-color: rgba(230, 220, 220, 0.0);
    color: #172b4d;
    // background: rgba($color: #cfcdcd, $alpha: 0.1);

    &:hover {
      color: black;
      // background-color: #ebecf0;
    }
  }
  input {
    outline: 0px;
    border: 0px;
    background-color: #f6f6f6;
  }
  div {
    margin-top: 5px;
  }
}
</style>
