/** PANELS ** 
*
* This script creates 6 widgets:
* - A simple panel with a div and an icon at the top
* - A panel set, where clicking on an icon will raise the div to fill
*   the space available
* - A simple tab (inheriting from panel) with an icon on the right
* - A tabset (inheriting from panelset) which opens tabs to the right
* - A two-field translator widget, where the translation field can
*   be hidden, or scrolled as a slave, with a button to open the
*   translate.google.com tab in the main window
* - A settings tab where Native and Target languages can be set
*
* REQUIREMENTS
* - css/styles.css is needed for the layout, opening and closing of
*   panels, tabs and disclosure
* - session.js is needed for the Session global, used to store the
*   activePanel, and native- and target-language codes
* - l10n.js is required for setSelector() calls to show the names of
*   languages
* - connection.js is required for tellBackground
*/



;(function create_panel($){
  "use strict"

  $.widget(
    "lxo.panel"

  , {
      options: {
        icon: 'data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#ccc"/></svg>'
      , iconSize: 48
      , html: "<div></div>"
      , className: "lxo-panel"
      , class: ""
      , rank: 0
      , id: "id_" + Math.floor(Math.random() * 100000)
      }   

    , _create: function panel_create () {
        this._modifyDOM("left")
        this._initialize()
        this._setUserActions()
      } 

    , _modifyDOM: function panel_modifyDOM(edge) {
        var options  = this.options
        var $panel   = this.element
        var offset   = {}
        offset[edge] = (options.iconSize + options.spacing)
                     * options.rank
                     + options.spacing
        
        this.$icon  = $("<img />")
                      .attr("src", options.icon)
                      .addClass("icon")
                      .offset(offset)

        $panel.attr("id", options.id) 
              .addClass(options.className) 
              .addClass(options.class)
              .append(this.$icon)

        if (options.src) {
          $panel.append($("<div></div>")
                        .append($("<iframe></iframe")
                                .attr("src", options.src)))
          // HACK required. When the Wiktionary page is shown in an
          // iFrame, the bottom is 12px too high without this hack
          Hack.tweakCSSDeclaration({
            selector: ".lxo-panels"
          , property: "bottom"
          , pause: 0
          , delay: 1000
          })
        } else if (options.ui) {
          $panel[options.ui](options.uiOptions)
        }
      }

    , _initialize: function initialize() {
        var method = this.options.init
        if (method instanceof Function) {
          method.call(this, this)
        }
      }

    , _setUserActions: function _setUserActions() {
        // var events = this.options.on
        // var event
        //   , action

        // for (event in events) {
        //   action = events[event]
        //   if (action.find) {
        //     this.element.find(action.find).on(event, action.listener)
        //   }          
        // }
      }
    }
  )
})(jQuery)



;(function create_tab($){
  "use strict"

  $.widget(
    "lxo.tab"
  , $.lxo.panel

  , { 
      options: {}

    , _create: function tab_create() {
        this._modifyDOM("top")
        this._initialize()
        this._setUserActions()
      }
    }
  )
})(jQuery)



;(function create_panelset($){ 
  "use strict"

  $.widget(
    "lxo.panelset"

  , {
      options: {
        panels: [{}]
      , className: "lxo-panels"
      , iconSize: 48
      , spacing: 12
      , top: 200
      , default: 0
      }

  //, panels: []
  //, activeIndex
    
    , _create: function panelset_create () { 
        this.panels = [] // local to this instance
        this._modifyDOM() 
        this._setUserActions()

        // this.panels is now populated
        this.openPanelByName(this.options.default)
      } 

    , _modifyDOM: function panelset_modifyDOM () {
        var $parent = this.element
        var options = this.options
        var panels  = options.panels
        var panelOptions
        var widget
        var $panel
        var icon
        var offset
        
        $parent.attr("id", options.id)
               .addClass(options.className)
               .css({ top: options.top })

        for (var ii = 0, total = panels.length; ii < total; ii ++) {
          $panel = $("<div></div>")
          panelOptions = panels[ii]
          if (!(widget = panelOptions.widget)) {
            widget = "panel"
          }

          panelOptions.rank = ii
          panelOptions.spacing = this.options.spacing
          $panel[widget](panelOptions)
          $parent.append($panel)

          this.panels.push($panel)
        }
      }
      
    , _setUserActions: function panelset_setUserActions() {
        var self = this
        var panels = this.panels
        var total = panels.length

        for (var ii = 0; ii < total; ii += 1) {
          addAction(panels[ii])
          
          function addAction(panel){
            var $panel = panel.data("lxo-panel")
                      || panel.data("lxo-tabset")
                      || panel.data("lxo-tab")
            var $element = $panel.element
            var $icon = $panel.$icon
            //var $other

            $panel.$icon.on("mouseup", function openPanel() {
              var panelIndex = -1
              self.panels.find(function (panel) {
                panelIndex += 1
                return (panel[0] === $element[0])
              })

              self.openPanelByIndex(panelIndex)

              // for (var ii = 0; ii < total; ii += 1) {
              //   $other = panels[ii]
              //   $other = $other.data("lxo-panel")
              //         || $other.data("lxo-tabset")
              //         || $other.data("lxo-tab")
                
              //   if ($other.element !== $panel.element) {
              //     self.toggleActive($other.element, false)
              //   }
              // }

              // if(!$panel.element.hasClass("active")) {
              //   self.toggleActive($panel.element, true)
              // }
             
              // HACK required. When a tab widget slides horizontally
              // to the left, the icon is trimmed at the right rather
              // than pushed off-screen to the left
              Hack.tweakCSSDeclaration({
                selector: ".lxo-tab > .icon"
              , property: "right"
              , pause: 500
              , delay: 0
              })
            })
          }
        }       
      }

    , openPanelByName: function openPanelByName(panelName) { 
        var activeIndex = this.getActiveIndex(
          this.options.panels
        , panelName
        )

        this.openPanelByIndex(activeIndex)
      }

    , openPanelByIndex: function openPanelByIndex(panelIndex) {
        var total = this.panels.length
        var ii

        if (this.activeIndex !== panelIndex) {          
          for (ii = 0; ii < total; ii += 1) {
            this.toggleActive(ii, ii === panelIndex)
          }

          this.activeIndex = panelIndex
        }
      }

      /**
      * [getActiveIndex description]
      * @param  {array} panels [ { id: <string> 
      *                          , ...}
      *                        , ...
      *                        ]
      * @param  {string} id    should be the value of the id
      *                        property of one of the objecs in
      *                        the panels array
      * @return {integer}      the index of the object with the
      *                        given id
      */
    , getActiveIndex: function getActiveIndex(panels, id) {
        var activeIndex = -1
        var panelOptions = panels.find(function(panel) {
          activeIndex += 1
          return panel.id === id
        })
        
        if (!panelOptions) {
          activeIndex = 0
        }

        return activeIndex
      }

    , toggleActive:  function toggleActive(panelIndex, makeActive) {
        var $panel = this.panels[panelIndex]

        if (makeActive) {
          $panel.addClass("active")
          Session.set("activePanel", $panel[0].id, true)
        } else {
          $panel.removeClass("active")
        }
      }

    , setTop: function setTop(top) {
        this.element.css({ top: top })
      }
    }
  )
})(jQuery)



;(function create_tabset($){
  "use strict"

  $.widget(
    "lxo.tabset"
  , $.lxo.panelset

  , { options: {}

  //, panels: []

    , _modifyDOM: function panelset_modifyDOM () {
        var options = this.options
        var offset  = (options.iconSize + options.spacing)
                    * options.rank
                    + options.spacing
        this.$icon  = $("<img />")
                      .attr("src", options.icon)
                      .addClass("icon")
                      .offset({left: offset})
        
        options.panels.forEach(function(panel) {
          panel.widget = "tab"
        })

        this._super()

         // Set icon, remove setting for top
        this.element.append(this.$icon)
        this.element[0].style.removeProperty("top")    
      }
    }
  )
})(jQuery)



;(function create_notebook($){
  "use strict"

  $.widget(
    "lxo.notebook"

  , {
      options: {
        separation: 300
      , default: 0
      }
    
    , _create: function notebook_create () {
        this._modifyDOM() 
        this._setUserActions()  
      } 

    , _modifyDOM: function notebook_modifyDOM () {
        var self = this
        var $parent = this.element
        var separation = this.options.separation

        var options = {
          maxHeight: separation
        , resize: function (height) {
            self.resizeTranslator.call(self, height)
          }
        }
        var $translator = $("<div></div>").translator(options)
        $parent.append($translator)
               
        var top = $translator.translator("getTop")

        options = {
          panels: [ 
            Settings.getOptions()
          , Wiktionary.getOptions()
          ]
        , default: this.options.default
        , top: top
        }
        this.$panelset = $("<div></div>").panelset(options)
        $parent.append(this.$panelset)
      }
          
    , _setUserActions: function notebook_setUserActions() {
      }

    , resizeTranslator: function resizeTranslator(height) {
        this.$panelset.panelset("setTop", height)
      }
    }
  )
})(jQuery)



;(function ready(){
  "use strict"

  Session.register({
    method: waitForInitialization
  , key: "status"
  , scope: self
  , immediate: false
  })

  function waitForInitialization(key, value) {
    if (value !== "connected") {
      return
    }

    var activePanel = Session.get("activePanel")

    $("body").notebook({
      separation: 320
    , default: activePanel
    })

    //setTimeout(function () {
      Session.set("status", "ready")
    //}, 1)
  }
})()



function OpenNoteBookPanel(panelName) {
  var $panelset = $(document.querySelector(".lxo-panels"))
  $panelset.panelset("openPanelByName", panelName)
}