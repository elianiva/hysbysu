package presentation

import (
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
	for _, meeting := range subject.Meetings {
		embed := &discordgo.MessageEmbed{
			Title: "📚 Inpo baru gaes!!",
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
			output += "• [" + lecture.Name + "](" + lecture.Url + ")\n"
			if lecture.Deadline != "" {
				output += "⠀" + lecture.Deadline + "\n"
			}
		}
	}
	return output
}

func (bot discordbot) Error(errDetail error) error {
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
