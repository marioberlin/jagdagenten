**CarPlay Developer Guide**   
June 2025 

 Developer

Table of Contents 

[**Introduction	3**](#introduction) 

[**Guidelines	4**](#guidelines) 

[**CarPlay simulators	7**](#carplay-simulators) 

[**Widgets in CarPlay	8**](#widgets-in-carplay) 

[**Live Activities in CarPlay	9**](#live-activities-in-carplay) 

[**CarPlay apps	10**](#carplay-apps) 

[Entitlements	11](#entitlements) 

[Templates	13](#templates) 

[Notifications	24](#notifications) 

[Assets	25](#assets) 

[Audio handling	26](#audio-handling) 

[Accessing data while iPhone is locked	26](#accessing-data-while-iphone-is-locked) 

[Launching other apps in CarPlay	26](#launching-other-apps-in-carplay) 

[**Build a CarPlay app	27**](#build-a-carplay-app) 

[Startup	27](#startup) 

[Create a list template	29](#create-a-list-template) 

[Create a now playing template	30](#create-a-now-playing-template) 

[**Build a CarPlay navigation app	31**](#build-a-carplay-navigation-app) 

[Supported displays	31](#supported-displays) 

[Additional templates for navigation apps	32](#additional-templates-for-navigation-apps) 

[Startup	39](#startup-1) 

[Route guidance	40](#route-guidance) 

[Multitouch	46](#multitouch) 

[Keyboard and list restrictions	47](#keyboard-and-list-restrictions) 

[Voice prompts	48](#voice-prompts) 

[Second map in CarPlay Dashboard or the instrument cluster	50](#second-map-in-carplay-dashboard-or-the-instrument-cluster) 

[Metadata in the instrument cluster or HUD	52](#metadata-in-the-instrument-cluster-or-hud) 

[Test your navigation app	56](#test-your-navigation-app) 

[**Sample code	60**](#sample-code) 

[**Publish your CarPlay app	61**](#publish-your-carplay-app) 

[**Appendix	62**](#appendix) 

[Deprecated entitlements	62](#deprecated-entitlements)

# Introduction  {#introduction}

CarPlay is a smarter, safer way to use your iPhone in the car. CarPlay takes the things you want to do with your iPhone while driving and puts them right on your car’s built-in display. CarPlay Ultra builds on the capabilities of CarPlay and provides the ultimate in-car experience by deeply integrating with the vehicle to deliver the best of iPhone and the best of the car. 

In addition to getting directions, making calls, sending and receiving messages, and listening to music, people can interact with your widgets, Live Activities, and apps in CarPlay and CarPlay Ultra. 

### **Widgets and Live Activities** 

Provide drivers with glanceable information and real-time updates via widgets and Live Activities. Widgets appear to the left of CarPlay Dashboard and support interaction on touchscreen vehicles. Live Activities are shown in CarPlay Dashboard, or as a notification. 

Your app does not need to be a CarPlay app to support widgets and Live Activities in CarPlay. 

### **CarPlay apps** 

Enable your app in CarPlay by supporting the CarPlay framework. The following categories of apps are supported. 

* Audio apps 

* Communication apps (via SiriKit Messaging and VoIP Calling) 

* Driving task apps 

* EV charging apps 

* Fueling apps 

* Navigation apps (route guidance with turn-by-turn directions) 

* Parking apps 

* Quick food ordering apps 

Note	This guide does not cover CarPlay automaker apps (a specific category of app published by automakers).

# Guidelines  {#guidelines}

### **Guidelines for widgets in CarPlay** 

1\. If your widget is not functional or suitable for use in the car, set the disfavored location modifier to include CarPlay. 

* If your widget is a game or requires extensive user interaction. For example, if your widget endlessly refreshes its content each time you tap (more than 6 taps/refreshes). 

* If your widget is non-functional or doesn’t serve a practical purpose in the car. For example, if your widget relies on data protection classes A or B it will generally be non-functional in CarPlay because most people use CarPlay while their iPhone is locked. 

* If your widget’s primary purpose is to launch your app on iPhone. For example, if the primary purpose of your widget is to launch your app, but your app isn’t a CarPlay app, your widget will be non-functional in CarPlay. 

For details on the disfavored location modifier, see Widgets in CarPlay. 

### **Guidelines for all CarPlay apps** 

1. Your CarPlay app must be designed primarily to provide the specified feature (e.g. CarPlay audio apps must be designed primarily to provide audio playback services, CarPlay parking apps must be designed primarily to provide parking services, etc.). 

2. Never instruct people to pick up their iPhone to perform a task. If there is an error condition, such as a required log in, you can let them know about the condition so they can take action when safe. However, alerts or messages must not include wording that asks people to manipulate their iPhone. 

3. All CarPlay flows must be possible without interacting with iPhone. 

4. All CarPlay flows must be meaningful to use while driving. Don’t include features in CarPlay that aren’t related to the primary task (e.g. unrelated settings, maintenance features, etc.). 

5. No gaming or social networking. 

6. Never show the content of messages, texts, or emails on the CarPlay screen. 

7. Use templates for their intended purpose, and only populate templates with the specified information types (e.g. a list template must be used to present a list for selection, album artwork in the now playing screen must be used to show an album cover, etc.). 

8. All voice interaction must be handled using SiriKit (with the exception of CarPlay navigation apps, see below). 

**Additional guidelines for CarPlay audio apps** 

1\.	Never show song lyrics on the CarPlay screen.

### **Additional guidelines for CarPlay communication (messaging and calling) apps** 

1. Communication apps must provide either short form text messaging features, VoIP calling features, or both. Email is not considered short form text messaging and is not permitted. 

2. Communication apps that provide text messaging features must support all 3 of the following SiriKit intents: 

   * Send a message (INSendMessageIntent) 

   * Request a list of messages (INSearchForMessagesIntent) 

   * Modify the attributes of a message (INSetMessageAttributeIntent) 

3. Communication apps that provide VoIP calling features must support CallKit, and the following SiriKit intent: 

   * Start a call (INStartCallIntent) 

### **Additional guidelines for CarPlay driving task apps** 

1. Driving task apps must enable tasks people *need* to do while driving. Tasks must actually *help* with the drive, not just be tasks that are done while driving. 

2. Driving task apps must use the provided templates to display information and provide controls. Other kinds of CarPlay UI (e.g. custom maps, real-time video) are not possible.  

3. Do not show CarPlay UI for tasks unrelated to driving (e.g. account setup, detailed settings).  

4. Do not periodically refresh data items in the CarPlay UI more than once every 10 seconds (e.g. no real-time engine data). 

5. Do not periodically refresh points of interest in the POI template more than once every 60 seconds. 

6. Do not create POI (point of interest) apps that are focused on finding locations on a map. Driving tasks apps must be primarily designed to accomplish tasks and are not intended to be location finders (e.g. store finders). 

7. Use cases outside of the vehicle environment are not permitted. 

### **Additional guidelines for CarPlay EV charging apps** 

1. EV charging apps must provide meaningful functionality relevant to driving (e.g. your app can’t just be a list of EV chargers). 

2. When showing locations on a map, do not expose locations other than EV chargers. 

### **Additional guidelines for CarPlay fueling apps** 

1. Fueling apps must provide meaningful functionality relevant to driving (e.g. your app can’t just be a list of fueling stations). 

2. When showing locations on a map, do not expose locations other than fueling stations. 

### **Additional guidelines for CarPlay parking apps** 

1. Parking apps must provide meaningful functionality relevant to driving (e.g. your app can’t just be a list of parking locations). 

2. When showing locations on a map, do not expose locations other than parking.

### **Additional guidelines for CarPlay navigation (turn-by-turn directions) apps** 

1. Navigation apps must provide turn-by-turn directions with upcoming maneuvers. 

2. The base view must be used exclusively to draw a map. Do not draw windows, alerts, panels, overlays, or user interface elements in the base view. For example, don’t draw lane guidance information in the base view. Instead, draw lane guidance information as a secondary maneuver using the provided template. 

3. Use each provided template for its intended purpose. For example, maneuver images must represent a maneuver and cannot represent other content or user interface elements. 

4. Provide a way to enter panning mode. If your app supports panning, you must include a button in the map template that allows people to enter panning mode since drag gestures are not available in all vehicles. 

5. Touch gestures must only be used for their intended purpose on the map (pan, zoom, pitch, and rotate). 

6. Immediately terminate route guidance when requested. For example, if the driver starts route guidance using the vehicle’s built-in navigation system, your app delegate will receive a cancelation notification and must immediately stop route guidance. 

7. Correctly handle audio. Voice prompts must work concurrently with the vehicle’s audio system (such as listening to the car’s FM radio) and your app should not needlessly activate audio sessions when there is no audio to play. 

8. Ensure that your map is appropriate in each supported country. 

9. Be open and responsive to feedback. Apple may contact you in the event that Apple or automakers have input to design or functionality. 

10. Voice control must be limited to navigation features. 

### **Additional guidelines for CarPlay quick food ordering apps** 

1. Quick food ordering apps must be Quick Service Restaurant (QSR) apps designed primarily for driving-oriented food orders (e.g. drive thru, pick up) when in CarPlay and are not intended to be general retail apps (e.g. supermarkets, curbside pickup). 

2. Quick food ordering apps must provide meaningful functionality relevant to driving (e.g. your app can’t just be a list of store locations). 

3. Simplified ordering only. Don’t show a full menu. You can show a list of recent orders, or favorites limited to 12 items each. 

4. When showing locations on a map, do not expose locations other than your Quick Service Restaurants. 

# CarPlay simulators  {#carplay-simulators}

Apple provides two simulators to help you develop and test your widgets, Live Activities, and CarPlay apps. CarPlay Simulator is a Mac app that simulates a CarPlay environment and connects to iPhone, just like a car. Xcode Simulator includes a CarPlay window that lets you quickly run and debug your CarPlay UI. 

It’s recommended that you use CarPlay Simulator to most closely match the behavior of CarPlay in a car. 

### **1\.	CarPlay Simulator** 

CarPlay Simulator is a standalone Mac app that simulates a car environment. CarPlay Simulator is included in the Additional Tools for Xcode package which you can download from [More Downloads.](https://developer.apple.com/download/all/?q=Additional%20Tools%20for%20Xcode) 

Locate CarPlay Simulator in the Hardware folder, run it, and connect iPhone using a USB cable. CarPlay starts on iPhone just as if you had it connected to a car. 

### **2\.	Xcode Simulator** 

Xcode Simulator lets you run and debug CarPlay apps in a second window. The window acts as the car’s display and allows you to interact with your CarPlay app in a similar manner to when you are connected to a CarPlay system. 

To access CarPlay in Xcode Simulator, launch Simulator and select I/O, External Displays, and CarPlay to show a CarPlay screen. 

Xcode Simulator is useful for regular build and test cycles for your CarPlay UI, but you should not rely exclusively on Xcode Simulator for all CarPlay app development. Here are some scenarios that require CarPlay Simulator or an actual CarPlay environment, and cannot be tested using Xcode Simulator. 

* Testing while iPhone is locked. Most people interact with CarPlay while iPhone is locked so you need to ensure that your app works correctly even when iPhone is locked. 

* Testing runtime scenarios such as switching between CarPlay and the car’s built-in UI, or connecting and disconnecting iPhone. 

* Testing scenarios where the car is playing audio. Remember that additional audio sources may be playing while CarPlay is active and your app must be a good audio citizen. For example, activating an audio session in your app has the side effect of immediately stopping the car’s FM radio so you must only activate your audio session when you are ready to play audio. 

* Testing Siri features with your app. 

* Testing your navigation app with instrument cluster displays. 

### **Testing using a vehicle or aftermarket head unit** 

You can also test your CarPlay app using an actual vehicle or an aftermarket head unit with a power supply. If you use an aftermarket head unit, choose one that supports wireless CarPlay so you can simultaneously connect iPhone to the head unit and to Xcode on your Mac using a cable.

# Widgets in CarPlay  {#widgets-in-carplay}

Provide drivers with glanceable information via widgets. Widgets appear to the left of CarPlay Dashboard (right of CarPlay dashboard in right-hand drive vehicles) and support interaction on touchscreen vehicles. Your app does not need to be a CarPlay app to support widgets. 

Widgets are supported in CarPlay Ultra, and with iOS 26 in CarPlay. 

People can customize which widgets they want to see in CarPlay by going to Settings → General → CarPlay on iPhone, and selecting their vehicle. 

To enable your widget in CarPlay, support the system small accessory widget family. 

.supportedFamilies(\[.systemSmall\]) 

If your widget is not functional or suitable for use in the car, use the disfavoredLocations modifier to specify carPlay. If you specify CarPlay as a disfavored location, your widget will be grouped in Settings with an indication that your widget is not optimized for CarPlay. People can still choose to show your widget but interaction will be disabled. 

.disfavoredLocations(\[.carPlay\], for: \[.systemSmall\]) 

For details on when to set CarPlay as a disfavored location, see Guidelines for widgets in CarPlay. 

Your widget can only launch your app in CarPlay if your app is also a CarPlay app. Use the standard widgetURL or Link mechanisms to launch your app in CarPlay. 

Widgets in CarPlay are optimized for each vehicle, including content margins, and if you mark your background as removable, your widget’s background will not be shown. For best practices on designing widgets, see [Human Interface Guidelines: Widgets.](https://developer.apple.com/design/human-interface-guidelines/widgets) 

# Live Activities in CarPlay  {#live-activities-in-carplay}

Provide drivers with timely updates through Live Activities. Live Activities are shown in CarPlay Dashboard, or as a notification. Your app does not need to be a CarPlay app to support Live Activities in CarPlay. 

Live Activities are supported with iOS 26 in CarPlay and CarPlay Ultra. 

To enable your Live Activity in CarPlay, support the small activity family. This is the same size used for Live Activities in the Apple Watch Smart Stack. If you already support Apple Watch, the same Live Activity will work in CarPlay. 

.supplementalActivityFamilies(\[.small\]) 

If you don’t support the small activity family, CarPlay will show the compact leading and compact trailing views from your Dynamic Island configuration instead. 

For best practices on designing widgets, see [Human Interface Guidelines: Live Activities.](https://developer.apple.com/design/human-interface-guidelines/live-activities)

# CarPlay apps  {#carplay-apps}

People download CarPlay apps from the App Store and use them on iPhone like any other app. When connected to a CarPlay vehicle, your app icon appears on the CarPlay home screen. CarPlay apps are not separate apps—you add CarPlay support to your existing app. 

CarPlay apps are designed to look and feel like your app on iPhone, but with UI elements that are similar to built-in CarPlay apps. 

Your app uses the CarPlay framework to present UI elements. iOS manages the display of UI elements and handles the interface with the car. Your app does not need to manage the layout of UI elements for different screen resolutions, or support different input hardware such as touchscreens, knobs, or touch pads. 

CarPlay apps must meet the basic requirements defined in the *CarPlay Entitlement Addendum*, and must follow the Guidelines. 

For general design guidance, see [Human Interface Guidelines for CarPlay.](https://developer.apple.com/design/human-interface-guidelines/carplay) 

## Entitlements  {#entitlements}

All CarPlay apps require a CarPlay app entitlement specific to your app category. 

To request a CarPlay app entitlement, go to [http://developer.apple.com/carplay](http://developer.apple.com/carplay) and provide information about your app, including the category of entitlement that you are requesting. You also need to agree to the CarPlay Entitlement Addendum. 

Apple will review your request. If your app meets the criteria for the CarPlay app category, Apple will assign a CarPlay app entitlement to your Apple Developer account and notify you. 

Once you have received a CarPlay app entitlement, create a new Provisioning Profile that includes the CarPlay app capability. 

1. Log in to your Apple Developer Account [https://developer.apple.com/account/.](https://developer.apple.com/account/) 

2. Under Certificates, IDs & Profiles, select Identifiers. 

3. Select the App ID associated with your app, or create a new App ID. 

4. Select the Additional Capabilities tab. 

5. Enable all necessary CarPlay app entitlements for your app. 

6. Click Save on the top right. 

7. Continue to Provisioning Profiles and create a new provisioning profile for your App ID. 

For additional information, see [Developer Account Help.](https://developer.apple.com/help/account/) 

After you have created a new Provisioning Profile, import it into Xcode. Xcode and Simulator require a Provisioning Profile that supports CarPlay. 

In Xcode, create an Entitlements.plist file in your project, if you don't have one already. Add your CarPlay app entitlement keys as a boolean key. The following example is for a CarPlay audio app. 

\<key\>com.apple.developer.carplay-audio\</key\> \<true/\> 

In Xcode, under *Signing & Capabilities* turn off *Automatically manage signing*, and under *Build Settings* ensure that *Code Signing Entitlements* is set to the path of your Entitlements.plist file. 

Once a CarPlay app entitlement is added to your app, your app icon will appear on the CarPlay home screen. You cannot selectively show or hide CarPlay for certain people. Only publish your app with CarPlay support when you are ready for everyone to see it. 

See Sample Code for project examples.

Use the entitlement key(s) that match your selected provisioning profile. 

**Minimum iOS**   
**Entitlement	Key	version**

| CarPlay Audio App (CarPlay framework) | com.apple.developer.carplay-audio | iOS 14 |
| :---- | :---- | :---- |
| CarPlay Communication App | com.apple.developer.carplay-communication | iOS 14 |
| CarPlay Driving Task App | com.apple.developer.carplay-driving-task | iOS 16 |
| CarPlay EV Charging App \*1 | com.apple.developer.carplay-charging | iOS 14 |
| CarPlay Fueling App \*1 | com.apple.developer.carplay-fueling | iOS 16 |
| CarPlay Navigation App | com.apple.developer.carplay-maps | iOS 12 |
| CarPlay Parking App | com.apple.developer.carplay-parking | iOS 14 |
| CarPlay Quick Food Ordering App | com.apple.developer.carplay-quick-ordering | iOS 14 |

\*1 CarPlay EV Charging App and CarPlay Fueling App entitlements may be combined in a single app. 

Some CarPlay entitlements are deprecated. For details, see Appendix: Deprecated entitlements.

## Templates  {#templates}

CarPlay apps are built from a fixed set of UI templates that iOS renders on the CarPlay screen. 

CarPlay apps are responsible for selecting which template to show on the screen (the controller), and providing data to be shown inside the template (the model). iOS is responsible for rendering the information in CarPlay (the view). 

The CarPlay framework includes general purpose templates for UI such as alerts, lists, and tab bars. It also provides templates designed for specific tasks such as locating points of interest, and showing now playing information. 

Each CarPlay app category supports specific templates and this is governed by the app entitlement. Attempting to use an unsupported template triggers an exception at runtime. 

Driving task, EV charging, fueling, 

parking, and quick 

|  | Audio | Communication | Navigation | food ordering |
| :---- | :---- | :---- | :---- | :---- |
| Action sheet template | ● \*2 | ● | ● | ● |
| Alert template | ● | ● | ● | ● |
| Grid template | ● | ● | ● | ● |
| List template | ● | ● | ● | ● |
| Tab bar template | ● | ● | ● | ● |
| Information template |  | ● | ● | ● |
| Point of interest template |  |  |  | ● |
| Now playing template | ● | ● \*2 |  |  |
| Contact template |  | ● | ● |  |
| Map template |  |  | ● |  |
| Search template |  |  | ● |  |
| Voice control template |  |  | ● |  |

\*2 Requires iOS 17 or later. 

There is a limit to the number of templates (depth of hierarchy) that you can push onto the screen. Most apps are limited to a depth of 5 templates. Fueling apps are further limited to 3 templates, and driving task and quick food ordering apps are limited to 2 templates. These include the root template.

#### **Action sheet template** 

An action sheet is a specific style of modal alert that appears in response to a control or action, and presents a set of two or more choices related to the current context. An action sheet can consist of a title, message, and buttons. Use action sheets to let people initiate tasks, or to request confirmation before performing a potentially destructive operation. 

*Action sheet template* 

#### **Alert template** 

Modal alerts convey important information related to the state of your app. An alert consists of a title and one or more buttons. You can provide titles of varying lengths and let CarPlay choose the title that best fits the available screen space. 

#### **Contact template** 

Contacts allow you to present information about a person or business. A contact consists of an image, title, subtitle, and action buttons. Use action buttons to let people perform tasks related to the current contact, such as making a phone call or sending a message. 

*Contact template* 

#### **Grid template** 

A grid is a specific style of menu that presents up to eight choices represented by an icon and a title. Use the grid template to let people select from a fixed list of items. The grid also includes a navigation bar with a title, leading buttons, and trailing buttons which can be shown as icons or text. 

#### **Information template** 

An information screen is a specific style of list that presents a limited number of static labels with optional footer buttons. Labels can appear in a single column or in two columns. Starting in iOS 16, the information template can also include leading and trailing navigation bar buttons. 

Use the information template to show important information. For example, an EV charging app may display information about a charging station such as availability, while a quick food ordering app may display an order summary such as pick-up location and time. 

Since the number of labels is limited, show only the most important summary information needed to complete a task. 

#### **List template** 

A list presents data as a scrolling, single-column table of items that can be divided into sections. Lists are ideal for presenting text or images, and can be used as a means of navigation for hierarchical information. 

Each item can include attributes such as an icon, title, subtitle, disclosure indicator, progress indicator, status indicator, and images. You can also choose from several configurations for each item. 

* **Item.** Shows a standard list item, such as an icon and text. 

* **Image row item.** Shows a series of images, such as album artwork. You can also choose from 5 additional element styles.\*3 

* Row element style 

* Card element style 

* Condensed element style 

* Grid element style 

* Image grid element style 

* **Message item.** Shows a contact or conversation, for communication apps.\*3 

The list template also supports pinned elements that always appear at the top of the list.\*3 Pinned elements consist of a set of grid elements with an image and title. Communication apps can further support a message configuration for pinned elements which allows you to indicate whether to show an unread indicator. 

Some cars dynamically limit lists to 12 list items. You can check for the maximum number of list items, but you always need to be prepared to handle the case where only 12 list items are shown. 

If your app supports SiriKit, you can also add an assistant item that appears in the list. 

\*3 Requires iOS 26 or later.

##### *List template with the first item configured as an image row item using the row element style* 

##### *List template with the first item configured as an image row item using the card element style* 

*List template with the first item configured as an image row item using the condensed element style*

##### *List template with the first item configured as an image row item using the grid element style* 

*List template with the first item configured as an image row item using the image grid element style* 

#### **Now playing template** 

The now playing screen presents information about the currently playing audio, such as title, artist, elapsed time, and album artwork. It also lets people control your app using playback control buttons. 

The now playing screen is customizable and you should adapt it to your needs. For example, you can provide a link to upcoming tracks, the playback control buttons can be customized with your own icons, and the elapsed time indicator can be configured for fixed-length audio or for open ended audio such as a live stream. 

The now playing template has some special features. 

* People can directly access it from the CarPlay home screen, or through the now playing button in your app’s navigation bar. You must be prepared to populate the now playing template at all times. 

* Only the list template may be pushed on top of the now playing template. For example, if your app enables the “Playing Next” button in the now playing template, you can respond by showing a list template containing the upcoming playback queue. 


The now playing template also supports sports mode.\*4 The sports mode presentation includes regular now playing information (playback controls, playback state, elapsed time, etc.) and sports information (team images, scores, countdown clock, etc.). If your app is capable of showing sports scores, you can populate your app’s existing now playing template with additional text and images to represent scores for any sport that involves 2 teams. 

When your app streams audio from a live or pre-recorded sporting event, you can transition your now playing template into sports mode, including the elapsed, or remaining time in the event clock. CarPlay automatically counts up or down from the point provided in the event clock on your behalf. At any point, your app can provide a new set of sports mode metadata to adjust scores, possession indicators, standings, and more. 

![][image1]

##### *Now playing template with sports mode* 

	Item	Content

| 1 | Background artwork (image) |
| :---- | :---- |
| 2 | Sports event status text (array of text) |
| 3 | Sports event status image (image) |
| 4 | Sports event clock configured as count up, count down, or paused (time) |
| L1, R1 | Team name (text) |
| L2, R2 | Team logo (image or text) |
| L3, R3 | Team standings (text) |
| L4, R4 | Team score (text) |
| L5, R5 | Possession indicator (image) |
| L6, R6 | Favorite indicator (boolean) |

\*4 Requires iOS 18.4 or later.

#### **Point of interest template** 

The point of interest screen lets people browse nearby locations on a map and choose one for further action. 

The point of interest template includes a map provided by MapKit, and an overlay containing a list of up to 12 locations with customizable pin images. 

Starting in iOS 16, you may optionally provide a larger pin image for the currently selected location. The list of locations should be limited to those that are most relevant or nearby. 

#### **Tab bar template** 

The tab bar is a versatile container for other templates, where each template occupies one tab in the tab bar. People can use the tab bar to rapidly switch between different templates. The title can include text or an image, such as a symbol. You are encouraged to take advantage of the SF Symbols library for seamless integration with the system font. You can optionally mark tabs with a small red indicator to show that they require action, or are displaying ephemeral information. 

Your app should observe the maximum tab count returned by iOS to determine the number of tabs to display. In current versions of iOS, the tab bar allows up to 4 tabs for audio apps and up to 5 tabs for all other app categories. This may change in the future so avoid relying on these fixed values. 

When your app is playing audio, CarPlay displays a now playing button in the top right corner of the tab bar for easy access to playback controls. The now playing button may not appear if your tab bar has more than 4 tabs. 

## Notifications  {#notifications}

Notifications are supported in CarPlay communication, EV Charging, and parking apps. Starting in iOS 18.4, notifications are also supported in CarPlay driving task apps. 

Notifications should be used sparingly in CarPlay and must be reserved for important tasks required while driving. Do not use notifications in CarPlay for features that are only relevant when using your app on iPhone. In general, notifications are not read aloud in CarPlay. 

Note that route guidance notifications in CarPlay navigation apps are handled by the CarPlay framework itself and are not part of the standard app notification mechanism. 

#### **Request authorization to show notifications** 

In order to show notifications in CarPlay, include the carPlay option when requesting authorization for notifications. 

Users can use Settings to show or hide your app’s notifications in CarPlay. Gracefully disable notification-related features if the driver declines to show notifications in CarPlay. 

let authorizationOptions : UNAuthorizationOptions \= \[.badge, .sound, .alert, .carPlay\] 

let notificationCenter \= UNUserNotificationCenter.current() 

notificationCenter.requestAuthorization(options: authorizationOptions) { 

    (granted, error) in 

    // Enable or disable app features based on authorization } 

#### **Create a notification category with the CarPlay option** 

In addition to requesting authorization, your app must enable CarPlay for the notification categories you want displayed. To enable CarPlay, create a notification category with the allowInCarPlay option. Assign an identifier to the category, and make sure that any local or remote notifications for messages have the same category identifier. 

If you are developing a CarPlay communication app, also see [Implementing communication notifications](https://developer.apple.com/documentation/usernotifications/implementing_communication_notifications) for more details on messaging notifications. In CarPlay, notifications must only include information such as the sender and group name in the title and subtitle. The contents of the message must never be shown in CarPlay.

## Assets  {#assets}

Prepare CarPlay assets for images used in templates such as icons and buttons. Note that CarPlay supports multiple scales and both light and dark interfaces so you should take this into account when creating assets. Create versions that are suitable for 2x and 3x scale factors, and for light and dark styles. You can turn on CarPlay assets in Xcode to populate CarPlay 2x and 3x image wells. 

Use the following size guidance when creating images. 

|  | Maximum size in points | Maximum size in pixels (3x) | Maximum size in pixels (2x) |
| :---- | :---- | :---- | :---- |
| Contact action button | 50pt x 50pt | 150px x 150px | 100px x 100px |
| Grid icon | 40pt x 40pt | 120px x 120px | 80px x 80px |
| Now playing action button | 20pt x 20pt | 60px x 60px | 40px x 40px |
| Tab bar icon | 24pt x 24pt | 72px x 72px | 48px x 48px |

For elements such as tab bar icons, you are encouraged to take advantage of the SF Symbols library for seamless integration with the system font. 

If you create assets programmatically, use UIImageAsset to combine UIImage instances into single image with both light and dark trait collections. 

If you need to know the CarPlay screen scale at runtime, use the trait collection carTraitCollection to obtain the display scale. Don’t use other parameters in the carTraitCollection and be sure to get the scale for the car’s screen (not the scale for the iPhone screen). 

To determine the sizes of images used in lists, use maximumImageSize in CPListItem and 

CPListImageRowItem to obtain the maximum image size and provide images with matching resolution. 

Use CarPlay Simulator to test your app and see how it appears under different conditions, including screen resolutions, scale factors, and light/dark styles. 

## Audio handling  {#audio-handling}

#### **Playback** 

If your app plays audio, ensure that it works well with audio sources in the car. 

Only activate your audio session the moment you are ready to play audio. When you activate your audio session, other audio sources in the car will stop. For example, if someone is listening to the car’s FM radio and you activate your audio session too soon, the FM radio will stop. People expect FM radio to continue to play until they explicitly choose to play an audio stream in your app. Don’t simply activate your audio session at the time your app launches. Instead, wait until you actually need to play audio. 

If you are developing a CarPlay navigation app, see Voice prompts for details on playing voice prompts for upcoming route maneuvers. 

#### **Recording** 

In general, recording is not supported while in CarPlay. If your app has recording features, don’t enable them when CarPlay is active. If you activate an audio session with recording enabled, it can affect audio playback from other sources and impact audio input for the car’s own functions such as voice assistants and phone calls. While in CarPlay, configure audio sessions without recording features. 

An exception is for CarPlay navigation apps which use recording features for voice input. In CarPlay navigation apps, recording features may be used, but only in conjunction with the voice control template. 

## Accessing data while iPhone is locked  {#accessing-data-while-iphone-is-locked}

CarPlay is frequently used while iPhone is in a locked state. Test your app throughly to ensure it works as expected when iPhone is locked. 

You won’t be able to access the following while iPhone is locked. 

* Files saved with NSFileProtectionComplete or NSFileProtectionCompleteUnlessOpen. 

* Keychain items with a kSecAttrAccessible attribute of kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, kSecAttrAccessibleWhenUnlocked or kSecAttrAccessibleWhenUnlockedThisDeviceOnly. 

## Launching other apps in CarPlay  {#launching-other-apps-in-carplay}

If your app launches other apps in CarPlay, such as to get directions or make a phone call, use the 

CPTemplateApplicationScene open(\_:options:completionHandler:) method to launch the other app using a URL to ensure it launches on the CarPlay screen. 

# Build a CarPlay app  {#build-a-carplay-app}

## Startup  {#startup}

All CarPlay apps must adopt [scenes](https://developer.apple.com/documentation/uikit/scenes) and declare a CarPlay scene to use the CarPlay framework. You can declare scenes dynamically, or you can include an application scene manifest in your Info.plist file. 

The following is an example of an application scene manifest that declares a CarPlay scene. You can add this to the top level of your Info.plist file. 

\<key\>UIApplicationSceneManifest\</key\> 

\<dict\> 

    \<key\>UISceneConfigurations\</key\> 

    \<dict\> 

        \<\!-- Declare device scene. \--\>         \<key\>UIWindowSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\> 

                \<string\>UIWindowScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>MyDeviceSceneConfiguration\</string\> 

                \<\!-- Specify the name of your scene delegate class. \--\>  

                \<key\>UISceneDelegateClassName\</key\> 

                \<string\>MyAppWindowSceneDelegate\</string\> 

            \</dict\> 

        \</array\> 

        \<\!-- Declare CarPlay scene \--\> 

        \<key\>CPTemplateApplicationSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\> 

                \<string\>CPTemplateApplicationScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>MyCarPlaySceneConfiguration\</string\> 

                \<\!-- Specify the name of your scene delegate class. \--\> 

                \<key\>UISceneDelegateClassName\</key\> 

                \<string\>MyCarPlaySceneDelegate\</string\> 

            \</dict\> 

        \</array\> 

    \</dict\> 

\</dict\> 

In the above example, the app declares 2 scenes—one for the iPhone screen, and one for the CarPlay screen. 

The name of the class that serves as the scene delegate is defined in the manifest by 

UISceneDelegateClassName. Your delegate must conform to CPTemplateApplicationSceneDelegate. Listen for the didConnect and didDisconnect methods to know when your app has been launched on the CarPlay screen. 

Your app may be launched *only* on the CarPlay screen so be sure to handle this use case. 

At launch, you may also receive URLs if your app registers to support them. Listen for URLs in each scene delegate your app supports by conforming to the UISceneDelegate methods willConnectTo and openURLContexts. URLs may exist in UIOpenURLContext objects, both as properties of the UIScene.ConnectionOptions object in willConnectTo, your app delegate’s configurationForConnectingSceneSession method, and as an object of openURLContexts. 

When your app is launched, you will receive a CPInterfaceController that manages all the templates on the CarPlay screen. Hold on to the controller since you’ll need it to manage templates, such as showing a list or a now playing screen. 

On launch, you must also specify a root template. In the example below, the app specifies a CPListTemplate as the root template. 

import CarPlay 

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {     var interfaceController: CPInterfaceController? 

    // CarPlay connected 

    func templateApplicationScene(\_ templateApplicationScene: CPTemplateApplicationScene,                                   didConnect interfaceController: CPInterfaceController) {         self.interfaceController \= interfaceController         let listTemplate: CPListTemplate \= ... 

        interfaceController.setRootTemplate(listTemplate, animated: true) 

    } 

    // CarPlay disconnected 

    func templateApplicationScene(\_ templateApplicationScene: CPTemplateApplicationScene,                                   didDisconnect interfaceController: CPInterfaceController) {         self.interfaceController \= nil 

    } 

} 

## Create a list template  {#create-a-list-template}

The following example shows how to create a list containing a single list item with a title and a subtitle. 

When a list item is selected, your list item handler will be called. You should take appropriate action here, such as starting audio playback in the case of an audio app. If you initiate asynchronous work and don’t immediately call the completion block, CarPlay will display a spinner to indicate that your app is busy. When you’re ready to continue, call the completion block to tell CarPlay to remove the spinner. 

import CarPlay 

let item \= CPListItem(text: “My title", detailText: “My subtitle")  item.listItemHandler \= { item, completion, \[weak self\] in     // Start playback asynchronously… 

    self.interfaceController.pushTemplate(CPNowPlayingTemplate.shared(), animated: true)     completion() 

} 

let section \= CPListSection(items: \[item\])  

let listTemplate \= CPListTemplate(title: "Albums", sections: \[section\])  self.interfaceController.pushTemplate(listTemplate, animated: true) 

## Create a now playing template  {#create-a-now-playing-template}

The now playing template is a shared instance so you need to obtain it and configure its properties. 

Do this when the interface controller connects to your app because iOS can display the shared now playing template on your behalf. For example, when the “Now Playing” button on the CarPlay home screen, or in your app’s navigation bar is tapped, iOS will immediately present the shared now playing template. 

This example shows an app configuring the playback rate button on the now playing template. 

import CarPlay class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {   
    func templateApplicationScene(\_ templateApplicationScene: CPTemplateApplicationScene,                                   didConnect interfaceController: CPInterfaceController) { 

         

        let nowPlayingTemplate \= CPNowPlayingTemplate.shared() 

        let rateButton \= CPNowPlayingPlaybackRateButton() { 

            // Change the playback rate\! 

        } 

        nowPlayingTemplate.updateNowPlayingButtons(\[rateButton\])  

    } 

} 

# Build a CarPlay navigation app  {#build-a-carplay-navigation-app}

The following section describes how to create a CarPlay navigation app. 

CarPlay navigation apps have additional UI elements and capabilities that are different from other CarPlay app categories. Skip this section if you are not creating a navigation app. 

## Supported displays  {#supported-displays}

CarPlay navigation apps can appear in the center display, the CarPlay Dashboard, and the instrument cluster in supported vehicles. In addition, CarPlay navigation apps can supply metadata for vehicles that display information in the instrument cluster or HUD (head-up display) in a wide variety of vehicles. Support all capabilities in your app for a seamless experience in all vehicle configurations. 

|  | Map in center display | Map in CarPlay dashboard | Map in instrument cluster | Metadata in instrument cluster or HUD |
| :---- | :---- | :---- | :---- | ----- |
| iOS 12 | ● |  |  |  |
| iOS 13.4 | ● | ● |  |  |
| iOS 16.4 | ● | ● | ● |  |
| iOS 17.4 | ● | ● | ● | ● |

## Additional templates for navigation apps  {#additional-templates-for-navigation-apps}

CarPlay navigation apps use additional templates to display maps, route guidance, keyboard searches, and voice control feedback. 

#### **Base view** 

All CarPlay navigation apps start with a base view. The base view is where you draw your map. Create the base view and attach it to the provided window when CarPlay starts. 

The base view must be used exclusively to draw a map, and cannot be used to draw alerts, overlays, or other UI elements. All UI elements that appear on the screen, including the navigation bar and map buttons, must be implemented using other templates. Your app won’t receive direct tap or drag events in the base view. 

Your app will be required to draw your map on a variety of screens with different aspect ratios, resolutions, and in light or dark mode. Get the current mode using contentStyle in your CarPlay template application scene and receive contentStyleDidChange notifications in your scene delegate. You also need to consider the safe area (the portion of the map not obscured by buttons). See Simulator for more information on testing with different display configurations, including testing light and dark mode. 

#### **Map template** 

The map template is a control layer that appears as an overlay over the base view and allows people to manipulate the map. It consists of a navigation bar and map buttons drawn as individual overlays. By default, the navigation bar appears when the driver interacts with the app, and disappears after a period of inactivity. You can customize this behavior, including whether to hide the map buttons. 

The navigation bar includes up to two leading buttons and two trailing buttons that can be specified with icons or text. 

You can also specify up to four map buttons which are shown as icons. Use the map buttons to provide zooming and panning features. Although many cars support panning through direct manipulation of the car’s touchscreen, there are cars that only support panning through knob or touch pad events. CarPlay supports these cars with a “panning mode.” If your app supports any panning features, you must allocate one of the map buttons to be a pan button that allows people to enter panning mode, and you must respond to the panning functions in CPMapTemplate. 

#### **Search template** 

The search template displays a text entry field, a list of search results, and a keyboard. Your app parses the text by responding to updatedSearchText and updating the list of search results with an array of CPListItem elements. You must also take action when an item is selected from the list by responding to selectedResult. 

Note that many cars limit when the keyboard may be shown. See Keyboard and list restrictions for details. 

*Search template* 

#### **Voice control template** 

The voice control template allows you to provide visual feedback during a voice control session. CarPlay navigation apps can provide a voice control feature, but it must be restricted to navigation functions. In addition, navigation apps must display the voice control template whenever a voice control audio session is active. 

All other categories of CarPlay app must use SiriKit or Siri Shortcuts to provide voice control features. 

#### **Panels** 

CarPlay navigation apps use panels to overlay information on the map. This includes trip previews, route selection, route guidance, and navigation alerts. You don’t create panels directly. Instead, use the provided APIs to trigger them. 

Trip preview panel. Displays up to 12 potential destinations and allows people to select one. The trip preview panel is typically the result of a destination search. When a trip is previewed, show a visual representation of that trip in your base view. 

##### *Trip preview panel* 

Route choice panel. Displays potential routes for a trip and allows people to select one. Each route should have a clear description so people can choose their preferred route. For example, a summary and optional description for a route could be “Via I-280 South” and “Traffic is light.” When a route is previewed, show a visual representation of that route in your base view. 

Guidance and trip estimate panels. Display upcoming maneuvers and trip estimates. 

Maneuvers are normally shown one at a time, but in cases where maneuvers appear in rapid succession, two maneuvers may be shown. The second maneuver may be repurposed to show lane guidance or a junction image for the first maneuver. 

In addition to providing upcoming maneuvers, you should continuously update overall trip estimates. 

##### *Guidance and trip estimate panels* 

Each maneuver can include a symbol, instruction text, estimated remaining distance, and time. 

You may optionally specify multiple variants for your images and instruction text so they appear differently in your app and the CarPlay Dashboard.  This includes maneuver symbols, junction images, notification symbols, instruction text and notification text. To specify something different, use the dashboard variants of the properties—for example, by default symbolImage defines what appears in your app and the CarPlay Dashboard, but if you also specify a dashboardSymbolImage property, then it will be used in the CarPlay Dashboard. 

Your app also provides metadata for maneuvers and lane guidance information that are displayed in the instrument cluster or HUD in supported vehicles. For details, see Show metadata in the instrument cluster or HUD.

Use the following guide when preparing maneuver symbol assets. Be sure to provide variants for light and dark interfaces. 

	Maximum size	Maximum size	Maximum size

|  | in points |  in pixels (3x) | in pixels (2x) |
| :---- | :---- | :---- | :---- |
| First maneuver symbol  (symbol and instruction on one line) | 50pt x 50pt | 150px x 150px | 100px x 100px |
| First maneuver symbol  (symbol and instruction on two lines) | 120pt x 50pt | 360px x 150px | 240px x 100px |
| Second maneuver symbol  (symbol and instructions) | 18pt x 18pt | 54px x 54px | 36px x 36px |
| Second symbol  (symbol only) | 120pt x 18pt | 360px x 54px | 240px x 36px |
| CarPlay Dashboard junction image | 140pt x 100pt | 420px x 300px | 280px x 200px |

Navigation alert panel. Displays important, real time feedback and optionally gives the driver a chance to make a decision that will affect the current route. For example, you should show an alert if there is unexpected traffic ahead and you are recommending that the driver take an alternate route. Navigation alerts result in a notification if your app is running in the background. 

Navigation alerts can consist of an image, title, subtitle, duration for which the alert is visible before it’s automatically dismissed, and up to 2 action buttons. For example, the action buttons could provide options to either maintain the current route, or take an alternate route. Starting in iOS 16 you can specify a navigation alert with longer subtitle text (in prior versions of iOS the subtitle is limited to 3 lines), no action buttons (in which case the alert will have a simple close button), or action buttons with custom colors. 

## Startup  {#startup-1}

CarPlay navigation apps declare two CarPlay scenes, one for the main app window in CarPlay, and one for the CarPlay Dashboard. For details on how to set up a scene manifest that supports CarPlay, see Application scene manifest example. 

Provide delegates for the CarPlay scene and the CarPlay Dashboard scene. Listen for the didConnect and didDisconnect methods to know when your app has been launched in each scene. In the main app window, your CPTemplateApplicationSceneDelegate will be called using the didConnect and didDisconnect methods that receive an interface controller and a window. CPInterfaceController and a CPWindow object. 

For the main app view, retain references to both the interface controller and the map content window for the duration of the CarPlay session. 

self.interfaceController \= interfaceController self.carWindow \= window 

Next, create a new view controller and assign it to the window’s root view controller. Use the view controller to manage your map content as the base view in the window. 

let rootViewController \= MyRootViewController() window.rootViewController \= rootViewController 

Finally, create a map template and assign it as the root template. 

let rootTemplate: CPMapTemplate \= createRootTemplate() self.interfaceController?.setRootTemplate(rootTemplate, animated: false) 

Create a default set of navigation bar buttons and map buttons and assign them to the root map template. Specify 

navigation bar buttons by setting up the leadingNavigationBarButtons and trailingNavigationBarButtons arrays. Specify map buttons by setting up the mapButtons array. 

If your CarPlay navigation app supports panning, one of the buttons you create must be a pan button that lets people enter panning mode. The pan button is essential in vehicles that don’t support panning via the touch screen. 

You can update the navigation bar buttons and map buttons dynamically based on the state of the app. For example, during active route guidance, you may choose to replace the default navigation bar buttons with an option to end route guidance. 

## Route guidance  {#route-guidance}

All CarPlay navigation apps follow a standard flow for selecting a destination and providing route guidance. 

![][image2] 

Select destination. All route guidance starts with selecting a destination, whether that is the result of an on-screen search, voice command, or picking a category or destination from a list. 

Preview. When a destination is selected, a trip preview is shown. At the same time, your map in the base view typically shows a visual representation of the trip. The preview also supports disambiguation when there are multiple matching destinations. For example, if the driver chooses to navigate to a nearby park, the preview may show several parks to choose from. 

Choose route and start guidance. Once the driver has confirmed the destination, they may start route guidance. If there are multiple possible routes, your app can present the routes as options to choose from. 

View trip information and upcoming maneuvers. When the driver starts route guidance, show real time information including upcoming maneuvers, and travel estimates (distance and time remaining) for the trip. 

End guidance. Route guidance continues until the driver arrives at the destination, or chooses to end route guidance. 

Re-route. Your app can optionally return to an active guidance state with a new route.

#### **Select destination** 

Use CPInterfaceController to present templates that allow people to specify a destination. To present a new 

template, use pushTemplate with a supported CPTemplate class such as CPGridTemplate, CPListTemplate, CPSearchTemplate, or CPVoiceControlTemplate. 

When an item selection or cancelation occurs, your delegate will be called with information about the action that was taken. 

You may present multiple templates in succession to support hierarchical selection. For example, you can show a list template that includes list items which lead to additional sublists when selected. Be sure to set 

showsDisclosureIndicator to true for list items that support hierarchical browsing, and push a new list template when the list item is selected. Hierarchical selections must never exceed five levels of depth. 

#### **Preview** 

After the driver has selected a destination and you are ready to show trip previews, use CPMapTemplate showTripPreviews to provide an array of up to 12 CPTrip objects. 

Each CPTrip object represents a journey consisting of an origin, a destination, up to 3 route choices, and estimates for remaining time and distance. 

Use CPRouteChoice to define each route choice. Your descriptions for each route are provided as arrays of variable length strings in descending order of length (longest string first). CarPlay will display the longest string that fits in the available space on the screen. 

For each CPTrip, be sure to provide travel estimates using CPMapTemplate updateEstimates: and update the estimates if the remaining time or distance change. 

You may also customize the names of the start, overview, and additional routes buttons shown in the trip preview panel. 

#### **Choose route and start guidance** 

When the driver selects a different route to preview, the delegate selectedPreviewFor: will be called. Respond by updating your map base view. 

If the driver decides to start a trip, the delegate startedTrip: will be called. Respond by starting route guidance. At this time, use CPMapTemplate hideTripPreviews to dismiss the trip preview panel. 

mapTemplate.hideTripPreviews() 

Next use CPMapTemplate startNavigationSession to start a navigation session for the selected trip and obtain a CPNavigationSession object that represents the active navigation session. let session \= mapTemplate.startNavigationSession(for: trip) 

While you are calculating initial maneuvers, set the navigation session pause state to CPTripPauseReasonLoading so that CarPlay can display the correct state. 

session.pauseTrip(for: .CPTripPauseReasonLoading) 

At this time, update the navigation bar buttons and map buttons to provide appropriate actions for the driver to manage their route. 

#### **View trip information and upcoming maneuvers** 

During turn by turn guidance, show route guidance information by updating upcomingManeuvers with information on upcoming turns. Each CPManeuver represents a single maneuver and may include a symbol, an instruction, metadata, and estimates for remaining time and distance. 

##### *Show a maneuver in the route guidance panel* 

Symbol. If the maneuver has an associated symbol, such as a turn right arrow, provide an image using symbolSet. The symbol will be shown in the route guidance card and any related notifications. You must provide two image variants using CPImageSet—one is used for rendering the symbol on light backgrounds, the other is used for rendering the symbol on dark backgrounds. 

Instruction. Provide an instruction using instructionVariants which is an array of strings. Use the array to provide variants of different lengths so that CarPlay can display the instruction that best fits in the available space on the screen. For example, if the maneuver requires you to turn right on the street named “Solar Circle” you may choose to provide 3 instruction variants “Turn Right on Solar Circle,” “Turn Right on Solar Cir.”, and “Turn Right”. CarPlay will display the instruction with the longest string length that fits in the available space. The array of instructions must be provided in descending order of length (longest string first). You may optionally provide 

attributedInstructionVariants to include embedded images in the instruction. This is useful if you need to display special symbols, such as a highway symbol, as part of the instruction. Note that other text attributes including text size and fonts will be ignored. If you provide attributedInstructionVariants, always provide text-only instructionVariants since CarPlay vehicles may not always support attributed strings. 

Metadata. Provide maneuver type, maneuver state, junction type, traffic side, and lane guidance information for display in the instrument cluster or HUD of supported vehicles. For details, see Show metadata in the instrument cluster or HUD. 

Add as many maneuvers as possible to upcomingManeuvers. At minimum, your app must maintain at least one upcoming turn in the maneuvers array at all times, and in cases where there are two maneuvers in quick succession, provide a second maneuver which may be shown on the screen simultaneously. 

If you provide a second maneuver, you can customize its appearance by specifying a symbol style. In 

CPMapTemplateDelegate, return a CPManeuverDisplayStyle for the maneuver when requested. The display style only applies to the second maneuver. 

If your app provides lane guidance information, you must use the second maneuver to show lane guidance. Create a second maneuver containing symbolSet with dark and light images that occupy the full width of the guidance panel (maximum size 120pt x 18pt), provide an empty array for instructionVariants, and in the 

CPMapTemplateDelegate, return a symbol style of CPManeuverDisplayStyleSymbolOnly for the maneuver. 

##### *Show a maneuver with lane guidance information* 

Your app is responsible for continuously updating estimates for remaining time and distance for each maneuver, and for the overall trip. Use CPNavigationSession updateEstimates: to update estimates for each maneuver, and CPMapTemplate updateEstimates to update overall estimates for the trip. Only update the values when significant changes occur, such as when the number of remaining minutes changes. 

If you need to display an alert related to the map or navigation, create a CPNavigationAlert and use 

CPMapTemplate present to show it. Navigation alerts can be configured to automatically disappear after a fixed interval. They may also be shown as a notification, even when your app is not in the foreground. 

For each maneuver and navigation alert, specify whether it should be shown as a CarPlay notification when your app is running in the background. Respond to the shouldShowNotificationFor delegate call to specify the maneuver or navigation alert behavior. In the case of a maneuver, you can optionally include updating travel estimates as part of the notification. 

In addition to the route guidance panel, maneuvers may also be shown in notifications, or sent to vehicles that support the display of CarPlay metadata in their instrument cluster or heads up display. 

#### **End guidance** 

When route guidance is paused, canceled, or finished, call the appropriate method in CPNavigationSession.  

In some cases, CarPlay route guidance may be canceled by the system. For example, if the car’s native navigation system starts route guidance, CarPlay route guidance automatically terminates. In this case, your delegate will receive mapTemplateDidCancelNavigation and you should end route guidance immediately. 

#### **Re-route** 

Starting in iOS 17.4, your app can programmatically return to an active guidance state. Use the 

CPNavigationSession method resumeTrip and provide a CPRouteInformation object with details about the new route. 

## Multitouch  {#multitouch}

Many new vehicles support multitouch interactions, including any vehicle that supports CarPlay Ultra. If a vehicle supports multitouch interactions in CarPlay, drivers can also interact with your navigation app.  

Your CPMapTemplate receives callbacks that allow you to react to multitouch gestures. 

* Zoom. Supported gestures include pinch to zoom, double tap (zoom in), and two-finger double tap (zoom out). 

* Pitch. Supported gestures include two-finger slide up, and two-finger slide down. 

* Rotate. Supported gestures include two-finger clockwise rotate, and two-finger counterclockwise rotate.

## Keyboard and list restrictions  {#keyboard-and-list-restrictions}

Some cars limit keyboard use and the lengths of lists while driving. iOS automatically disables the keyboard and reduces list lengths when the car indicates it should do so. However, if your app needs to adjust other user interface elements in response to these changes, you can receive notifications when the limits change. For example, you may want to disable a keyboard icon or adjust list items when list lengths are shorter. Use CPSessionConfiguration to observe limitedUserInterfaces.

## Voice prompts  {#voice-prompts}

Voice prompts are essential for a route guidance experience, but you must ensure that your app is a good audio citizen and works well with other audio sources on iPhone and in the car. 

#### **Audio session configuration** 

CarPlay navigation apps must use the following audio session configuration when playing voice prompts for upcoming maneuvers. 

1. Set the audio session category to AVAudioSessionCategoryPlayback. 

2. Set the audio session mode to AVAudioSessionModeVoicePrompt. 

3. Set the audio session category options to 

AVAudioSessionCategoryOptionInterruptSpokenAudioAndMixWithOthers and AVAudioSessionCategoryOptionDuckOthers. 

Voice prompts are played over a separate audio channel and mixed with audio sources in the car, including the car’s own audio sources such as FM radio. 

AVAudioSessionCategoryOptionInterruptSpokenAudioAndMixWithOthers allows voice prompts to pause certain apps with spoken audio (such as podcasts or audio books) and mix with other apps such as music. 

AVAudioSessionCategoryOptionDuckOthers allows voice prompts to duck (lower the volume) for other apps such as music while your audio is played. 

#### **Activate and deactivate the audio session** 

Keep your audio session deactivated until you are ready to play a voice prompt. Call setActive with YES only when a voice prompt is ready to play. You may keep the audio session active for short durations if you know that multiple audio prompts are going to be played in rapid succession. However, while your AVAudioSession is active, music apps will remain ducked, and apps with spoken audio will remain paused. Don’t hold on to the active state for more than few seconds if audio prompts are not playing. 

When you are done playing a voice prompt, call setActive with NO to allow other audio to resume. 

#### **Prompt style** 

In some cases it doesn’t make sense to play a voice prompt. For example, the driver may be on a phone call or in the middle of using Siri. 

Just before playing each voice prompt, check the audio session’s promptStyle. If necessary, it will return a hint to alter the type of prompt you should play in response to other system audio. 

	Prompt style	Action

| None | Don’t play any sound |
| :---- | :---- |
| Short | Play a tone |
| Normal | Play a full spoken prompt |

## Second map in CarPlay Dashboard or the instrument cluster  {#second-map-in-carplay-dashboard-or-the-instrument-cluster}

People using your navigation app want to see important information, even when your app is not the foreground app in CarPlay. 

Support for CarPlay Dashboard. Starting with iOS 13.4, you can add support for CarPlay Dashboard. Display your map, upcoming maneuvers, and dashboard buttons so they are available at a glance inside CarPlay Dashboard. 

Support for the instrument cluster. Starting with iOS 15.4, you can add support for instrument cluster displays in supported vehicles. Display your map and upcoming maneuvers, so they are visible at a glance in the car’s instrument cluster display. 

It’s easy to support both CarPlay Dashboard and instrument cluster displays since they work in the same way. 

CPTemplateApplicationDashboardScene and CPTemplateApplicationInstrumentClusterScene 

are new UIScene subclasses that CarPlay creates when it determines that your app should appear in CarPlay Dashboard or the instrument cluster. 

CPDashboardController and CPDashboardButton let you manage the CarPlay Dashboard and the buttons that appear inside it. CPInstrumentClusterController lets you manage instrument cluster displays. 

#### **Indicate support for the CarPlay dashboard and instrument cluster** 

In your application scene manifest, set CPSupportsDashboardNavigationScene and 

CPSupportsInstrumentClusterNavigationScene to true and provide corresponding keys for your scenes and delegates. Also see Application scene manifest example. 

#### **Create scene delegates** 

Define delegates for CarPlay Dashboard and instrument cluster scenes just like you would for the main template application scene. These delegates conform to CPTemplateApplicationDashboardSceneDelegate and CPTemplateApplicationInstrumentClusterSceneDelegate and will be called with instances of CPDashboardController or CPInstrumentClusterController. 

#### **Draw your content** 

Use the provided windows to draw map content for display in the CarPlay Dashboard or instrument cluster. 

When drawing maps in the instrument cluster, you must follow these guidelines:  

* Draw a minimal version of your map with minimal clutter 

* Show a detailed view of the upcoming route, not an overview 

* Ensure the current heading is facing up (the top of the screen) 

Also, as with all maps rendered in CarPlay, be sure to observe safe areas, and light and dark mode settings (similar to 

your base view, use the contentMode in CPTemplateApplicationDashboardScene or CPTemplateApplicationInstrumentClusterScene). 

When navigation begins in your app using CPMapTemplate and CPNavigationSession, CarPlay automatically displays maneuver information. 

For the CarPlay Dashboard, you can also provide two instances of CPDashboardButton to 

CPDashboardController. These buttons appear in the guidance card area when your app is not actively navigating. People can interact with your app through the dashboard buttons as well as within your main app interface. 

For instrument cluster displays, some cars may allow the driver to zoom the map in and out. It’s your responsibility to respond to these events in your delegate. Similarly, if your app includes a compass or speed limit, the corresponding delegates will tell your app whether it’s appropriate to draw them or not. Depending on the shape of the car’s instrument cluster, your view area may be partially obscured by other elements in the car. Override viewSafeAreaInsetsDidChange on your view controller to know when the safe area changes, and use the safeAreaLayoutGuide on your cluster view to ensure that important content in the area of the view is always visible.

## Metadata in the instrument cluster or HUD  {#metadata-in-the-instrument-cluster-or-hud}

People using your navigation app want to see important information in the instrument cluster or HUD (Head-Up Display) in supported vehicles. Many vehicles, even those without a full digital instrument cluster display, show metadata for upcoming maneuvers in smaller displays inside their instrument cluster. Modern vehicles with a HUD also show metadata on their windshield. 

Starting with iOS 17.4, your app can provide metadata for upcoming maneuvers. This includes maneuver state, maneuver type (e.g. “turn right”, “make a U-turn”), junction type, and lane guidance information. 

Declare support for metadata. Use the delegate method mapTemplateShouldProvideNavigationMetadata in CPMapTemplateDelegate to indicate that your app supports sending metadata to the vehicle. 

Provide information about upcoming maneuvers and the current trip. Supply multiple maneuvers, including maneuver type and lane guidance information, when route guidance starts. Use add CPManeuver and add CPLaneGuidance. 

Provide as many maneuvers as possible to support vehicles that display multiple maneuvers in the instrument cluster or HUD, and to improve performance. Additional maneuvers can be added during route guidance. 

Your app should also set the current road name, and update the maneuver state which indicates progress within a maneuver. When approaching a maneuver, the maneuver state should transition from continue → initial → prepare → execute → continue. 

	Maneuver state	Description

| continue | Continue along this route until next maneuver |
| :---- | :---- |
| initial | Maneuver is in the near future |
| prepare | Maneuver is in the immediate future |
| execute | In maneuver |

Required maneuver properties include maneuverType, junctionType and trafficSide. Note that maneuver metadata supplements the symbol and instruction which is used on the CarPlay screen. 

For lane guidance, use CPLaneGuidance and CPLane to provide lane guidance metadata for the vehicle. Again, lane guidance metadata  supplements showing lane guidance using symbolSet on the CarPlay screen. 

#### **Manuever types** 

For the maneuver type, select from one of the following predefined values. 

Maneuver type	Description

| arriveAtDestination | Destination has been reached, navigation will end |
| :---- | :---- |
| arriveAtDestinationLeft | Destination has been reached; it is on the left and navigation will end |
| arriveAtDestinationRight | Destination has been reached; it is on the right and navigation will end |
| arriveEndOfDirections | Navigation complete, but rest of journey requires another transport method |
| arriveEndOfNavigation | Navigation complete, but rest of journey requires another transport method |
| changeFerry | Change to a different ferry |
| changeHighway | Highway to highway change with implied or unknown side of the road |
| changeHighwayLeft | Highway to highway change from the left side of the road |
| changeHighwayRight | Highway to highway change from the right side of the road |
| enterRoundabout | Enter roundabout |
| enter\_Ferry | Enter ferry |
| exitFerry | Exit ferry |
| exitRoundabout | Exit roundabout |
| followRoad | Continue to follow the road the vehicle is currently on |
| highwayOffRampLeft | Exit highway on left |
| highwayOffRampRight | Exit highway on right |
| keepLeft | Bifurcation or other smooth maneuver (compare to slightLeftTurn) |
| keepRight | Bifurcation or other smooth maneuver (compare to slightRightTurn) |
| leftTurn | Angle is between \-45° and \-135° |
| leftTurnAtEnd | At the end of the road, turn left |
| noTurn | No turn (default value) |
| offRamp | Take ramp to leave highway |
| onRamp | Take ramp to merge onto highway |
| rightTurn | Angle is between 45° and 135° |
| rightTurnAtEnd | At the end of the road, turn right |
| roundaboutExit1 | Exit roundabout at the 1st street |
| roundaboutExit2 | Exit roundabout at the 2nd street |
| roundaboutExit3 | Exit roundabout at the 3rd street |

| roundaboutExit4 | Exit roundabout at the 4th street |
| :---- | :---- |
| roundaboutExit5 | Exit roundabout at the 5th street |
| roundaboutExit6 | Exit roundabout at the 6th street |
| roundaboutExit7 | Exit roundabout at the 7th street |
| roundaboutExit8 | Exit roundabout at the 8th street |
| roundaboutExit9 | Exit roundabout at the 9th street |
| roundaboutExit10 | Exit roundabout at the 10th street |
| roundaboutExit11 | Exit roundabout at the 11th street |
| roundaboutExit12 | Exit roundabout at the 12th street |
| roundaboutExit13 | Exit roundabout at the 13th street |
| roundaboutExit14 | Exit roundabout at the 14th street |
| roundaboutExit15 | Exit roundabout at the 15th street |
| roundaboutExit16 | Exit roundabout at the 16th street |
| roundaboutExit17 | Exit roundabout at the 17th street |
| roundaboutExit18 | Exit roundabout at the 18th street |
| roundaboutExit19 | Exit roundabout at the 19th street |
| sharpLeftTurn | Angle is between \-135° and \-180° |
| sharpRightTurn | Angle is between 135° and 180° |
| slightLeftTurn | Turn onto a different road (compare to keepLeft) |
| slightRightTurn | Turn onto a different road (compare to keepRight) |
| startRoute | Proceed to the beginning of the route |
| startRouteWithUTurn | Make a U-turn and proceed to the route |
| straightAhead | Continue straight through the intersection (implies road name will change) |
| uTurn | Make a U-turn and proceed to the route |
| uTurnAtRoundabout | Use roundabout to make a U-turn |
| uTurnWhenPossible | Make a U-turn when possible |

#### **Junction types** 

For the junction type, select from one of the following predefined values. 

| intersection | Single intersection with junction elements representing roads coming to a common point |
| :---- | :---- |
| roundabout | Roundabout with junction elements representing roads exiting the roundabout |

#### **Traffic side** 

For the traffic side, select from one of the following predefined values. 

| right | Right (or anti-clockwise for roundabouts) |
| :---- | :---- |
| left | Left (or clockwise for roundabouts) |

#### **Lane angles and lane status** 

Lane angles specify angles (or a single angle) between \-180° and \+180°. For the lane status, select from one of the following predefined values. 

| notGood | The vehicle should not take this lane |
| :---- | :---- |
| good | The vehicle can take this lane, but may need to move lanes again before upcoming maneuvers |
| preferred | The vehicle should take this lane to be in the best position for upcoming maneuvers |

## Test your navigation app  {#test-your-navigation-app}

If you are developing a navigation app, it’s important to try different display configurations to ensure your map drawing code works correctly. Note that CarPlay supports both landscape and portrait displays and can scale from 2x at low resolutions to 3x at high resolutions. Here are some recommended screen sizes to test. 

	Width and height	Scale

| Minimum (smallest possible CarPlay screen) | 748px x 456px | 2.0 |
| :---- | :---- | :---- |
| Standard (default resolution typical of many CarPlay screens) | 800px x 480px | 2.0 |
| High resolution (typical of larger CarPlay screens) | 1920px x 720px | 3.0 |
| Portrait (example of a vertical CarPlay screen) | 900px x 1200px | 3.0 |

In CarPlay Simulator, simply click Configure to change the display configuration. 

In Xcode Simulator, first enable extra options by entering the following command in Terminal before launching Xcode Simulator. Xcode Simulator does not simulate the instrument cluster or show metadata. defaults write com.apple.iphonesimulator CarPlayExtraOptions \-bool YES 

#### **Test maps in instrument cluster displays** 

Use CarPlay Simulator to test your map in instrument cluster displays. 

Click Configure | Cluster Display, turn on Instrument Cluster Display enabled and specify scale factor, screen size, safe area, and safe area sizes. Here are some recommended configurations to test. 

|  | Scale Factor | Size | Safe Area Origin | Safe Area Size |
| :---- | :---- | :---- | :---- | :---- |
| Minimum | 3x | 300 x 200 | 0, 0 | 300 x 200 |
| Basic | 2x | 640 x 480 | 0, 0 | 640 x 480 |
| Widescreen (wide safe area) | 3x | 1920 x 720 | 420, 0 | 1080 x 720 |
| Widescreen (small safe area) | 2x | 1920 x 720 | 640, 120 | 640 x 480 |

#### **Test metadata in the instrument cluster or HUD** 

Use CarPlay Simulator to confirm that your app is correctly supplying metadata for display in the instrument cluster or HUD in supported vehicles. 

With an active navigation session, click Navigation to view the next upcoming maneuver. 

Click Show More to see the full sequence of upcoming maneuvers provided by your app. Inside the larger information screen, click the table icons to Maneuvers or Lane Guidances to view detailed information.

#### **Application scene manifest example** 

The following is an example of an application scene manifest that supports both the CarPlay Dashboard and instrument cluster displays. 

\<key\>UIApplicationSceneManifest\</key\> 

\<dict\> 

    \<\!-- Declare support for CarPlay Dashboard. \--\> 

    \<key\>CPSupportsDashboardNavigationScene\</key\> 

    \<true/\> 

    \<\!-- Declare support for instrument cluster displays. \--\> 

    \<key\>CPSupportsInstrumentClusterNavigationScene\</key\> 

    \<true/\> 

    \<\!-- Declare support for multiple scenes. \--\> 

    \<key\>UIApplicationSupportsMultipleScenes\</key\> 

    \<true/\> 

    \<key\>UISceneConfigurations\</key\> 

    \<dict\> 

        \<\!-- For device scenes \--\>         \<key\>UIWindowSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\> 

                \<string\>UIWindowScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>Phone\</string\> 

                \<key\>UISceneDelegateClassName\</key\> 

                \<string\>MyAppWindowSceneDelegate\</string\> 

            \</dict\> 

        \</array\> 

       \<\!-- For the main CarPlay scene \--\>         \<key\>CPTemplateApplicationSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\> 

                \<string\>CPTemplateApplicationScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>CarPlay\</string\> 

                \<key\>UISceneDelegateClassName\</key\> 

                \<string\>MyAppCarPlaySceneDelegate\</string\> 

            \</dict\> 

        \</array\> 

        \<\!-- For the CarPlay Dashboard scene \--\>         \<key\>CPTemplateApplicationDashboardSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\>                 \<string\>CPTemplateApplicationDashboardScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>CarPlay-Dashboard\</string\> 

                \<key\>UISceneDelegateClassName\</key\>                 \<string\>MyAppCarPlayDashboardSceneDelegate\</string\>             \</dict\> 

        \</array\> 

        \<\!-- For the CarPlay instrument cluster scene \--\>         \<key\>CPTemplateApplicationInstrumentClusterSceneSessionRoleApplication\</key\> 

        \<array\> 

            \<dict\> 

                \<key\>UISceneClassName\</key\>                 \<string\>CPTemplateApplicationInstrumentClusterScene\</string\> 

                \<key\>UISceneConfigurationName\</key\> 

                \<string\>CarPlay-Instrument-Cluster\</string\> 

                \<key\>UISceneDelegateClassName\</key\>                 \<string\>MyAppCarPlayInstrumentClusterSceneDelegate\</string\> 

            \</dict\> 

        \</array\> 

    \</dict\> 

\</dict\> 

# Sample code  {#sample-code}

The following sample code is available to help you get started developing your CarPlay app. 

### **Integrating CarPlay with your music app** 

CarPlay Music is a sample music app that demonstrates how to display a custom UI from a CarPlay–enabled vehicle. 

CarPlay Music integrates with the CarPlay framework by implementing the CPNowPlayingTemplate and CPListTemplate. This sample’s iOS app component provides a logging interface to help you understand the life cycle of a CarPlay app, as well as a music controller. 

[Download](https://developer.apple.com/documentation/carplay/integrating_carplay_with_your_music_app) 

### **Integrating CarPlay with your quick food ordering app** 

CarPlay Quick-Ordering is a sample quick food ordering app that demonstrates how to display custom ordering options in a vehicle that has CarPlay enabled. The sample app integrates with the CarPlay framework by implementing CPTemplate subclasses, such as CPPointOfInterestTemplate and CPListTemplate. This sample’s iOS app component provides a logging interface to help you understand the life cycle of a CarPlay app. 

[Download](https://developer.apple.com/documentation/carplay/integrating_carplay_with_your_quick-ordering_app) 

### **Integrating CarPlay with your navigation app** 

Coastal Roads is a sample navigation app that demonstrates how to display a custom map and navigation instructions in a CarPlay–enabled vehicle. Coastal Roads integrates with the CarPlay framework by implementing the map and additional CPTemplate subclasses, such as CPGridTemplate and CPListTemplate. This sample’s iOS app component provides a logging interface to help you understand the life cycle of a CarPlay app. 

[Download](https://developer.apple.com/documentation/carplay/integrating_carplay_with_your_navigation_app) 

# Publish your CarPlay app  {#publish-your-carplay-app}

When you are ready to publish your CarPlay app on the App Store, follow the same process as for any iOS app and use App Store Connect to submit your app. 

Ensure that your app follows the CarPlay Guidelines. 

# Appendix  {#appendix}

## Deprecated entitlements  {#deprecated-entitlements}

#### **Audio apps** 

Audio apps support CarPlay by using the CarPlay framework, but can also use the Media Player framework (deprecated for CarPlay). Be sure to include the correct entitlement(s) to match the framework(s) your app actually supports. On iOS 14 and later, the CarPlay framework will be used if your app supports both frameworks. 

| Entitlement | Key |
| :---- | :---- |
| CarPlay Audio App (Media Player framework) (Deprecated) | com.apple.developer.playable-content |

If your app needs to work on iOS 13 and earlier, support the Media Player framework and include the com.apple.developer.playable-content entitlement. Apps that only support the Media Player framework will work on later versions of iOS, but your user interface is not customizable. 

#### **Communication apps** 

Communication apps work in CarPlay by using SiriKit and CallKit, and implement a user interface by supporting the CarPlay framework. 

If your app needs to work on iOS 13 and earlier, also include the com.apple.developer.carplay-messaging and/or com.apple.developer.carplay-calling entitlements to match your app features. Apps that don’t support the CarPlay framework will still work on later versions of iOS, but your user interface is not customizable. 

**Entitlement	Key**

| CarPlay Messaging App (Deprecated) | com.apple.developer.carplay-messaging |
| :---- | :---- |
| CarPlay VoIP Calling App (Deprecated) | com.apple.developer.carplay-calling |

 

Apple Inc. 

Copyright © 2025 Apple Inc. All rights reserved. 

No part of this publication may be reproduced, stored in a retrieval system, or transmitted, in any form or by any means, mechanical, electronic, photocopying, recording, or otherwise, without prior written permission of Apple Inc., with the following exceptions: Any person is hereby authorized to store documentation on a single computer or device for personal use only and to print copies of documentation for personal use provided that the documentation contains Apple’s copyright notice. 

No licenses, express or implied, are granted with respect to any of the technology described in this document. Apple retains all intellectual property rights associated with the technology described in this document. This document is intended to assist application developers to develop applications only for Apple-branded products. 

Apple Inc.

One Apple Park Way

Cupertino, CA 95014

408-996-1010 

Apple is a trademark of Apple Inc., registered in the U.S. and other countries. 

APPLE MAKES NO WARRANTY OR 

REPRESENTATION, EITHER EXPRESS OR 

IMPLIED, WITH RESPECT TO THIS 

DOCUMENT, ITS QUALITY, ACCURACY, 

MERCHANTABILITY, OR FITNESS FOR A 

PARTICULAR PURPOSE. AS A RESULT, THIS 

DOCUMENT IS PROVIDED “AS IS,” AND YOU, THE READER, ARE ASSUMING THE ENTIRE RISK AS TO ITS QUALITY AND ACCURACY. 

IN NO EVENT WILL APPLE BE LIABLE FOR 

DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR 

CONSEQUENTIAL DAMAGES RESULTING 

FROM ANY DEFECT, ERROR OR INACCURACY IN THIS DOCUMENT, even if advised of the possibility of such damages. 

Some jurisdictions do not allow the exclusion of implied warranties or liability, so the above exclusion may not apply to you.

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>