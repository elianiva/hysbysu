package presentation

import (
	"fmt"
	"hysbysu/internal"
	"hysbysu/model"
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/pkg/errors"
)

type discordbot struct {
	config  internal.Config
	discord *discordgo.Session
}

var hasError = false

func NewDiscordBot(config internal.Config) (*discordbot, error) {
	discord, err := discordgo.New("Bot " + config.DiscordToken)
	if err != nil {
		return nil, err
	}
	discord.Identify.Intents = discordgo.IntentGuildMessages

	log.Println("discord client starting...")
	err = discord.Open()
	if err != nil {
		return nil, err
	}

	return &discordbot{config, discord}, nil
}

func (bot discordbot) Notify(subject model.Subject) error {
	// the server is OK, so we reset the error status
	hasError = false

	for _, meeting := range subject.Meetings {
		embed := &discordgo.MessageEmbed{
			Title: "📚 Inpo tugas!!",
			Author: &discordgo.MessageEmbedAuthor{
				Name:    subject.Lecturer.Name,
				IconURL: "https://twirpz.files.wordpress.com/2015/06/twitter-avi-gender-balanced-figure.png",
				// TODO(elianiva): figure out why the image won't load on discord
				// IconURL: subject.Lecturer.ImageUrl,
			},
			Color: 0x61afef,
			Fields: []*discordgo.MessageEmbedField{
				{Name: "Title", Value: meeting.Title},
				{Name: "Subject", Value: meeting.Subject},
			},
			Thumbnail: &discordgo.MessageEmbedThumbnail{
				URL: "https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png",
			},
			Timestamp: time.Now().Format(time.RFC3339),
			Footer: &discordgo.MessageEmbedFooter{
				Text: "kalo ada tugas buru dikerjain, gausah ditunda tunda",
			},
		}

		assignments := bot.buildLectureList(meeting.Lectures, model.LectureAssignment)
		if len(assignments) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Assignments",
				Value: assignments,
			})
		}

		resources := bot.buildLectureList(meeting.Lectures, model.LectureResource)
		if len(resources) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Resources",
				Value: resources,
			})
		}

		quizzes := bot.buildLectureList(meeting.Lectures, model.LectureQuiz)
		if len(quizzes) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Quizzes",
				Value: quizzes,
			})
		}

		forums := bot.buildLectureList(meeting.Lectures, model.LectureForum)
		if len(forums) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Forums",
				Value: forums,
			})
		}

		externalResource := bot.buildLectureList(meeting.Lectures, model.LectureUrl)
		if len(externalResource) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "External Resources",
				Value: externalResource,
			})
		}

		uncategorised := bot.buildLectureList(meeting.Lectures, model.LectureUnknown)
		if len(uncategorised) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Uncategorised",
				Value: uncategorised,
			})
		}

		log.Println("sending message to " + bot.config.DiscordChannelId)
		_, err := bot.discord.ChannelMessageSendEmbed(bot.config.DiscordChannelId, embed)
		if err != nil {
			return errors.Wrap(err, "failed to send message to discord")
		}
	}

	return nil
}

func (bot discordbot) buildLectureList(lectures []model.Lecture, lectureType model.LectureType) string {
	output := ""
	for _, lecture := range lectures {
		if lecture.Type == lectureType {
			output += fmt.Sprintf("• [%s](%s)", lecture.Name, lecture.Url)
			deadline := time.UnixMilli(lecture.Deadline)
			if !deadline.In(bot.config.TimeZone).IsZero() {
				output += "⠀" + deadline.Format("Monday, 02 January 2006, 15:04 PM") + "\n"
			}
		}
	}
	return output
}

func (bot discordbot) Error(errDetail error) error {
	if hasError {
		return nil
	}

	// mark if it has error so it doesn't repeatedly send the same error message
	hasError = true

	embed := &discordgo.MessageEmbed{
		Title:       "❗ Ada yg error bang",
		Color:       0xf54242,
		Description: "```\n" + errDetail.Error() + "\n```",
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer: &discordgo.MessageEmbedFooter{
			Text: "tolong mention @elianiva kalo orangnya belom ngerespon",
		},
	}

	_, err := bot.discord.ChannelMessageSendEmbed(bot.config.DiscordChannelId, embed)
	if err != nil {
		return errors.Wrap(err, "failed to log error message to discord")
	}

	return nil
}

func (bot discordbot) Remind(reminders []model.ReminderItem) ([]model.ReminderItem, error) {
	copiedReminders := make([]model.ReminderItem, 0)

	for _, reminder := range reminders {
		timeDiff := time.Duration(reminder.Deadline - time.Now().UnixMilli())
		if timeDiff <= time.Hour*6 {
			embed := &discordgo.MessageEmbed{
				Title:       "🔔 Inpo deadline!!",
				Description: "Ingfo tugas mepet, buruan kerjain kalo belom",
				Color:       0xB5CEA8,
				Fields: []*discordgo.MessageEmbedField{
					{Name: "Subject", Value: reminder.SubjectName},
					{Name: "Title", Value: fmt.Sprintf("[%s](%s)", reminder.Name, reminder.Url)},
					{Name: "Deadline", Value: time.UnixMilli(reminder.Deadline).Format("Monday, 02 January 2006, 15:04 PM")},
				},
				Thumbnail: &discordgo.MessageEmbedThumbnail{
					URL: "https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png",
				},
				Timestamp: time.Now().Format(time.RFC3339),
				Footer: &discordgo.MessageEmbedFooter{
					Text: "hayoloh, mampus kau kalo belom ngerjain, suruh siapa nunda nunda",
				},
			}

			_, err := bot.discord.ChannelMessageSendEmbed(bot.config.DiscordChannelId, embed)
			if err != nil {
				return copiedReminders, errors.Wrap(err, "failed to log error message to discord")
			}

			if time.Now().UnixMilli() < reminder.Deadline {
				reminder.HasBeenReminded = true
				copiedReminders = append(copiedReminders, reminder)
			}
		}
	}

	return copiedReminders, nil
}

func (bot discordbot) Started() error {
	_, err := bot.discord.ChannelMessageSend(bot.config.DiscordChannelId, "I'm Alive!")
	return err
}
